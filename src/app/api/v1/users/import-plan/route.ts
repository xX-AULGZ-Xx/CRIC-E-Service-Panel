import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/lib/auth';
import { ensureDivisionsSeeded, hashUserPassword, saveUserDepartments } from '@/lib/users';
import { UserRole } from '@/types/service';

export const dynamic = 'force-dynamic';

interface PlanDivisionInput {
  id: number | string;
  name: string;
  code: string;
}

interface PlanDepartmentInput {
  id: number | string;
  name: string;
  division_id: number | string;
  division_code?: string | null;
  division_name?: string | null;
}

interface PlanUserInput {
  id: number | string;
  username: string;
  email?: string | null;
  password_hash?: string | null;
  full_name: string;
  position?: string | null;
  role?: string;
  personnel_type?: string | null;
  department_id?: number | string | null;
  division_id?: number | string | null;
  department_name?: string | null;
  division_name?: string | null;
  department_ids?: Array<number | string>;
  division_ids?: Array<number | string>;
  head_dept_ids?: Array<number | string>;
  is_active?: boolean;
  avatar_url?: string | null;
}

interface PlanExportBundle {
  divisions: PlanDivisionInput[];
  departments: PlanDepartmentInput[];
  users: PlanUserInput[];
}

function mapPlanRoleToPanel(planRole?: string): UserRole {
  switch (String(planRole || '').toUpperCase()) {
    case 'ADMIN':
      return 'admin';
    case 'DIRECTOR':
      return 'director';
    case 'DEPUTY_DIRECTOR':
      return 'deputy_director';
    case 'PLANNING_OFFICER':
      return 'planning_officer';
    case 'HEAD_DEPT':
    case 'HEAD_OF_DEPT':
      return 'head_dept';
    case 'TEACHER':
      return 'teacher';
    default:
      return 'staff';
  }
}

function normalizeExportBundle(raw: any): PlanExportBundle {
  const root = raw?.data && (Array.isArray(raw.data.users) || Array.isArray(raw.data.divisions)) ? raw.data : raw;

  if (!root || !Array.isArray(root.users)) {
    throw new Error('รูปแบบข้อมูลไม่ถูกต้อง: ไม่พบรายการ users ในไฟล์หรือ API response');
  }

  return {
    divisions: Array.isArray(root.divisions) ? root.divisions : [],
    departments: Array.isArray(root.departments) ? root.departments : [],
    users: root.users,
  };
}

async function fetchPlanExportLive(customUrl?: string, customSecret?: string): Promise<{ bundle: PlanExportBundle; sourceUrl: string }> {
  const candidates = [
    customUrl?.trim(),
    process.env.PLAN_API_URL?.trim(),
    'http://localhost:5050',
    'http://127.0.0.1:5050',
    'https://plan.cric.ac.th',
  ].filter(Boolean) as string[];

  const syncSecret = customSecret?.trim() || process.env.PANEL_SYNC_SECRET || 'cric-panel-sync-2026';
  const errors: string[] = [];

  for (const base of Array.from(new Set(candidates))) {
    const cleanBase = base.replace(/\/+$/, '');
    const endpoint = cleanBase.endsWith('/api/v1/admin/export-users')
      ? cleanBase
      : `${cleanBase}/api/v1/admin/export-users`;

    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'X-CRIC-SYNC-KEY': syncSecret,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        errors.push(`${cleanBase}: HTTP ${res.status} (${json?.message || 'failed'})`);
        continue;
      }

      return {
        bundle: normalizeExportBundle(json),
        sourceUrl: cleanBase,
      };
    } catch (err: any) {
      errors.push(`${cleanBase}: ${err?.message || 'เชื่อมต่อไม่สำเร็จ'}`);
    }
  }

  throw new Error(`ไม่สามารถเชื่อมต่อระบบ Plan เพื่อดึงข้อมูลได้ (${errors.join('; ')})`);
}

async function syncPlanOrgUnitsToPanel(divisions: PlanDivisionInput[], departments: PlanDepartmentInput[]) {
  await ensureDivisionsSeeded();

  const existingDivisions = await prisma.division.findMany();
  const divByExtId = new Map(existingDivisions.filter((d) => d.externalId !== null).map((d) => [d.externalId!, d]));
  const divByCode = new Map(existingDivisions.map((d) => [d.code.toUpperCase(), d]));
  const divByName = new Map(existingDivisions.map((d) => [d.name.trim().toLowerCase(), d]));

  const planDivToPanelId = new Map<string, string>();
  let divisionsSynced = 0;

  for (const pDiv of divisions) {
    const rawExtStr = String(pDiv.id);
    const parsedExt = Number(pDiv.id);
    const extIdNum = Number.isFinite(parsedExt) ? parsedExt : null;
    const codeUpper = String(pDiv.code || `DIV_${rawExtStr}`).trim().toUpperCase();
    const cleanName = String(pDiv.name || codeUpper).trim();

    let matched =
      (extIdNum !== null ? divByExtId.get(extIdNum) : undefined) ||
      divByCode.get(codeUpper) ||
      divByName.get(cleanName.toLowerCase());

    if (matched) {
      const canAssignExt = extIdNum !== null && (!divByExtId.has(extIdNum) || divByExtId.get(extIdNum)?.id === matched.id);
      if ((canAssignExt && matched.externalId !== extIdNum) || matched.name !== cleanName) {
        matched = await prisma.division.update({
          where: { id: matched.id },
          data: {
            externalId: canAssignExt ? extIdNum : matched.externalId,
            name: cleanName,
          },
        });
      }
    } else {
      const canAssignExt = extIdNum !== null && !divByExtId.has(extIdNum);
      matched = await prisma.division.create({
        data: {
          code: codeUpper,
          name: cleanName,
          externalId: canAssignExt ? extIdNum : null,
        },
      });
    }

    planDivToPanelId.set(rawExtStr, matched.id);
    if (matched.externalId !== null) divByExtId.set(matched.externalId, matched);
    divByCode.set(matched.code.toUpperCase(), matched);
    divByName.set(matched.name.trim().toLowerCase(), matched);
    divisionsSynced++;
  }

  // Reload all divisions to guarantee fallback division exists
  const allDivisions = await prisma.division.findMany();
  const fallbackDivision = allDivisions[0];

  const existingDepts = await prisma.department.findMany();
  const deptByExtId = new Map(existingDepts.filter((d) => d.externalId !== null).map((d) => [d.externalId!, d]));
  const deptByDivAndName = new Map(
    existingDepts.map((d) => [`${d.divisionId}::${d.name.trim().toLowerCase()}`, d])
  );
  const deptByNameOnly = new Map(existingDepts.map((d) => [d.name.trim().toLowerCase(), d]));

  const planDeptToPanelId = new Map<string, string>();
  let departmentsSynced = 0;

  for (const pDept of departments) {
    const rawExtStr = String(pDept.id);
    const parsedExt = Number(pDept.id);
    const extIdNum = Number.isFinite(parsedExt) ? parsedExt : null;
    const cleanName = String(pDept.name || `แผนก ${rawExtStr}`).trim();
    const targetDivId =
      planDivToPanelId.get(String(pDept.division_id)) ||
      (pDept.division_code ? divByCode.get(String(pDept.division_code).toUpperCase())?.id : undefined) ||
      fallbackDivision?.id;

    if (!targetDivId) continue;

    let matched =
      (extIdNum !== null ? deptByExtId.get(extIdNum) : undefined) ||
      deptByDivAndName.get(`${targetDivId}::${cleanName.toLowerCase()}`) ||
      deptByNameOnly.get(cleanName.toLowerCase());

    if (matched) {
      const canAssignExt = extIdNum !== null && (!deptByExtId.has(extIdNum) || deptByExtId.get(extIdNum)?.id === matched.id);
      if ((canAssignExt && matched.externalId !== extIdNum) || matched.name !== cleanName) {
        matched = await prisma.department.update({
          where: { id: matched.id },
          data: {
            externalId: canAssignExt ? extIdNum : matched.externalId,
            name: cleanName,
            divisionId: targetDivId,
          },
        });
      }
    } else {
      const canAssignExt = extIdNum !== null && !deptByExtId.has(extIdNum);
      matched = await prisma.department.create({
        data: {
          name: cleanName,
          divisionId: targetDivId,
          externalId: canAssignExt ? extIdNum : null,
        },
      });
    }

    planDeptToPanelId.set(rawExtStr, matched.id);
    if (matched.externalId !== null) deptByExtId.set(matched.externalId, matched);
    deptByDivAndName.set(`${matched.divisionId}::${matched.name.trim().toLowerCase()}`, matched);
    deptByNameOnly.set(matched.name.trim().toLowerCase(), matched);
    departmentsSynced++;
  }

  return {
    planDivToPanelId,
    planDeptToPanelId,
    divisionsSynced,
    departmentsSynced,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUserSession();
    if (!session || !session.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin role required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, apiUrl, syncKey, rawPayload, selectedUsernames, conflictStrategy = 'overwrite' } = body;

    if (action === 'preview-live' || action === 'preview-json') {
      let bundle: PlanExportBundle;
      let sourceUrl: string | undefined;

      if (action === 'preview-live') {
        const live = await fetchPlanExportLive(apiUrl, syncKey);
        bundle = live.bundle;
        sourceUrl = live.sourceUrl;
      } else {
        bundle = normalizeExportBundle(rawPayload);
      }

      const existingUsers = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          role: true,
          sourceSystem: true,
        },
      });

      const byUsername = new Map(existingUsers.map((u) => [u.username.toLowerCase(), u]));
      const byEmail = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u]));
      const deptNameMap = new Map(bundle.departments.map((d) => [String(d.id), d.name]));

      const previewItems = bundle.users.map((u) => {
        const cleanUsername = String(u.username || '').trim().toLowerCase();
        const autoEmail = !u.email || !String(u.email).trim();
        const cleanEmail = autoEmail
          ? `${cleanUsername}@cric.ac.th`
          : String(u.email).trim().toLowerCase();

        const existing = byUsername.get(cleanUsername) || byEmail.get(cleanEmail);
        const rawDeptIds =
          Array.isArray(u.department_ids) && u.department_ids.length > 0
            ? u.department_ids
            : u.department_id
              ? [u.department_id]
              : [];

        const departmentNames = rawDeptIds
          .map((id) => deptNameMap.get(String(id)))
          .filter(Boolean) as string[];

        if (departmentNames.length === 0 && u.department_name) {
          departmentNames.push(u.department_name);
        }

        return {
          planId: String(u.id),
          username: cleanUsername,
          fullName: u.full_name,
          email: cleanEmail,
          autoEmail,
          role: mapPlanRoleToPanel(u.role),
          planRole: u.role || 'TEACHER',
          position: u.position || null,
          departmentNames,
          isHeadCount: Array.isArray(u.head_dept_ids) ? u.head_dept_ids.length : 0,
          isActive: u.is_active !== false,
          status: existing ? ('conflict' as const) : ('new' as const),
          existingUserId: existing?.id || null,
          existingDisplayName: existing?.displayName || null,
          existingRole: existing?.role || null,
        };
      });

      return NextResponse.json({
        success: true,
        sourceUrl,
        summary: {
          total: previewItems.length,
          newCount: previewItems.filter((i) => i.status === 'new').length,
          conflictCount: previewItems.filter((i) => i.status === 'conflict').length,
          divisionsCount: bundle.divisions.length,
          departmentsCount: bundle.departments.length,
        },
        bundle,
        items: previewItems,
      });
    }

    if (action === 'execute') {
      const bundle = normalizeExportBundle(rawPayload);
      const selectedSet =
        Array.isArray(selectedUsernames) && selectedUsernames.length > 0
          ? new Set(selectedUsernames.map((s: string) => String(s).trim().toLowerCase()))
          : null;

      const { planDeptToPanelId, divisionsSynced, departmentsSynced } = await syncPlanOrgUnitsToPanel(
        bundle.divisions,
        bundle.departments
      );

      let created = 0;
      let updated = 0;
      let skipped = 0;
      let failed = 0;
      const errors: Array<{ username: string; error: string }> = [];

      for (const u of bundle.users) {
        const cleanUsername = String(u.username || '').trim().toLowerCase();
        if (!cleanUsername) continue;
        if (selectedSet && !selectedSet.has(cleanUsername)) continue;

        try {
          const autoEmail = !u.email || !String(u.email).trim();
          let cleanEmail = autoEmail
            ? `${cleanUsername}@cric.ac.th`
            : String(u.email).trim().toLowerCase();

          let existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
          if (!existing) {
            existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
          }

          if (existing && conflictStrategy === 'skip') {
            skipped++;
            continue;
          }

          // Guard email collision against another distinct user
          const emailOwner = await prisma.user.findUnique({ where: { email: cleanEmail } });
          if (emailOwner && (!existing || emailOwner.id !== existing.id)) {
            cleanEmail = `${cleanUsername}.plan${String(u.id)}@cric.ac.th`;
          }

          const rawDeptIds =
            Array.isArray(u.department_ids) && u.department_ids.length > 0
              ? u.department_ids
              : u.department_id
                ? [u.department_id]
                : [];

          const panelDeptIds = rawDeptIds
            .map((id) => planDeptToPanelId.get(String(id)))
            .filter(Boolean) as string[];

          const rawHeadIds = Array.isArray(u.head_dept_ids) ? u.head_dept_ids : [];
          const panelHeadDeptIds = rawHeadIds
            .map((id) => planDeptToPanelId.get(String(id)))
            .filter(Boolean) as string[];

          const panelRole = mapPlanRoleToPanel(u.role);
          const deptSummary = u.department_name || null;
          const passwordHash =
            u.password_hash && String(u.password_hash).trim().length > 0
              ? String(u.password_hash).trim()
              : hashUserPassword('password123');

          if (existing) {
            await prisma.user.update({
              where: { id: existing.id },
              data: {
                displayName: String(u.full_name || existing.displayName).trim(),
                email: cleanEmail,
                passwordHash,
                role: panelRole,
                position: u.position ? String(u.position).trim() : null,
                personnelType: u.personnel_type || (panelRole === 'teacher' || panelRole === 'head_dept' ? 'TEACHER' : 'STAFF'),
                sourceSystem: 'plan',
                externalId: String(u.id),
                department: deptSummary,
                isActive: u.is_active !== false,
                avatarUrl: u.avatar_url || existing.avatarUrl,
              },
            });

            await saveUserDepartments(existing.id, panelDeptIds, panelHeadDeptIds, deptSummary);
            updated++;
          } else {
            const newUser = await prisma.user.create({
              data: {
                username: cleanUsername,
                email: cleanEmail,
                passwordHash,
                displayName: String(u.full_name || cleanUsername).trim(),
                role: panelRole,
                position: u.position ? String(u.position).trim() : null,
                personnelType: u.personnel_type || (panelRole === 'teacher' || panelRole === 'head_dept' ? 'TEACHER' : 'STAFF'),
                sourceSystem: 'plan',
                externalId: String(u.id),
                department: deptSummary,
                isActive: u.is_active !== false,
                authProvider: 'local',
                avatarUrl: u.avatar_url || null,
              },
            });

            await saveUserDepartments(newUser.id, panelDeptIds, panelHeadDeptIds, deptSummary);
            created++;
          }
        } catch (err: any) {
          failed++;
          errors.push({
            username: cleanUsername,
            error: err?.message || 'เกิดข้อผิดพลาดระหว่างนำเข้า',
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `นำเข้าข้อมูลเสร็จสิ้น (เพิ่มใหม่ ${created} รายการ, อัปเดต ${updated} รายการ, ข้าม ${skipped} รายการ)`,
        summary: {
          created,
          updated,
          skipped,
          failed,
          divisionsSynced,
          departmentsSynced,
        },
        errors,
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/v1/users/import-plan error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูลจากระบบ Plan' },
      { status: 500 }
    );
  }
}
