import 'dotenv/config';
import { db } from '../src/db';
import { companies, employees, departments, kpiTemplates, kpiCriteria } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seedRoleHierarchy() {
  try {
    console.log('🌱 Starting role hierarchy seed...');

    // Get the first company
    const [company] = await db.select().from(companies).limit(1);
    if (!company) {
      console.error('No company found. Please run the main seed first.');
      return;
    }

    console.log(`📦 Using company: ${company.name}`);

    // Create departments if they don't exist
    const existingDepts = await db.select().from(departments).where(eq(departments.companyId, company.id));

    let executiveDept = existingDepts.find(d => d.name === 'Executive');
    let salesDept = existingDepts.find(d => d.name === 'Sales');
    let techDept = existingDepts.find(d => d.name === 'Technology');
    let hrDept = existingDepts.find(d => d.name === 'Human Resources');
    let opsDept = existingDepts.find(d => d.name === 'Operations');

    if (!executiveDept) {
      [executiveDept] = await db.insert(departments).values({
        companyId: company.id,
        name: 'Executive',
        description: 'Executive Leadership',
        status: 'active',
      }).returning();
    }

    const deptIds = {
      executive: executiveDept.id,
      sales: salesDept?.id,
      tech: techDept?.id,
      hr: hrDept?.id,
      ops: opsDept?.id,
    };

    console.log('📋 Creating role hierarchy with all levels...');

    const passwordHash = await bcrypt.hash('password123', 10);

    // Check if super admin already exists
    const existingSuperAdmin = await db.select().from(employees)
      .where(eq(employees.email, 'john.ceo@company.com')).limit(1);

    if (existingSuperAdmin.length > 0) {
      console.log('⚠️ Role hierarchy data already exists. Cleaning up...');
      // Delete existing test users
      await db.delete(employees).where(eq(employees.companyId, company.id));
      console.log('✅ Cleaned up existing test data');
    }

    // 1. SUPER ADMIN - Top of hierarchy, no supervisor
    const [superAdmin] = await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-SA-001',
      fullName: 'John CEO',
      email: 'john.ceo@company.com',
      passwordHash,
      phone: '+1234567800',
      position: 'Chief Executive Officer',
      departmentId: deptIds.executive,
      supervisorId: null, // No supervisor for super admin
      joinDate: '2020-01-01',
      status: 'active',
      role: 'super_admin',
    }).returning();

    console.log('✅ Created Super Admin: john.ceo@company.com');

    // 2. MANAGERS - Report to Super Admin or other Managers
    const [salesManager] = await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-MGR-001',
      fullName: 'Alice Sales Manager',
      email: 'alice.manager@company.com',
      passwordHash,
      phone: '+1234567801',
      position: 'Sales Director',
      departmentId: deptIds.sales,
      supervisorId: superAdmin.id, // Reports to CEO
      joinDate: '2021-01-15',
      status: 'active',
      role: 'manager',
    }).returning();

    const [techManager] = await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-MGR-002',
      fullName: 'Bob Tech Manager',
      email: 'bob.manager@company.com',
      passwordHash,
      phone: '+1234567802',
      position: 'Engineering Director',
      departmentId: deptIds.tech,
      supervisorId: superAdmin.id, // Reports to CEO
      joinDate: '2021-02-01',
      status: 'active',
      role: 'manager',
    }).returning();

    const [hrManager] = await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-MGR-003',
      fullName: 'Carol HR Manager',
      email: 'carol.manager@company.com',
      passwordHash,
      phone: '+1234567803',
      position: 'HR Director',
      departmentId: deptIds.hr,
      supervisorId: superAdmin.id, // Reports to CEO
      joinDate: '2021-03-01',
      status: 'active',
      role: 'manager',
    }).returning();

    // Manager reporting to another Manager (middle management)
    const [regionalManager] = await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-MGR-004',
      fullName: 'Diana Regional Manager',
      email: 'diana.manager@company.com',
      passwordHash,
      phone: '+1234567804',
      position: 'Regional Sales Manager',
      departmentId: deptIds.sales,
      supervisorId: salesManager.id, // Reports to Sales Director
      joinDate: '2022-01-01',
      status: 'active',
      role: 'manager',
    }).returning();

    console.log('✅ Created 4 Managers');

    // 3. LEADERS - Report to Managers
    const [salesLeader1] = await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-LDR-001',
      fullName: 'Eric Sales Leader',
      email: 'eric.leader@company.com',
      passwordHash,
      phone: '+1234567810',
      position: 'Sales Team Lead',
      departmentId: deptIds.sales,
      supervisorId: regionalManager.id, // Reports to Regional Manager
      joinDate: '2022-06-01',
      status: 'active',
      role: 'leader',
    }).returning();

    const [salesLeader2] = await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-LDR-002',
      fullName: 'Fiona Sales Leader',
      email: 'fiona.leader@company.com',
      passwordHash,
      phone: '+1234567811',
      position: 'Inside Sales Lead',
      departmentId: deptIds.sales,
      supervisorId: salesManager.id, // Reports to Sales Director
      joinDate: '2022-07-01',
      status: 'active',
      role: 'leader',
    }).returning();

    const [techLeader1] = await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-LDR-003',
      fullName: 'George Tech Leader',
      email: 'george.leader@company.com',
      passwordHash,
      phone: '+1234567812',
      position: 'Frontend Team Lead',
      departmentId: deptIds.tech,
      supervisorId: techManager.id, // Reports to Tech Manager
      joinDate: '2022-08-01',
      status: 'active',
      role: 'leader',
    }).returning();

    const [techLeader2] = await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-LDR-004',
      fullName: 'Helen Backend Leader',
      email: 'helen.leader@company.com',
      passwordHash,
      phone: '+1234567813',
      position: 'Backend Team Lead',
      departmentId: deptIds.tech,
      supervisorId: techManager.id, // Reports to Tech Manager
      joinDate: '2022-09-01',
      status: 'active',
      role: 'leader',
    }).returning();

    const [hrLeader] = await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-LDR-005',
      fullName: 'Ian HR Leader',
      email: 'ian.leader@company.com',
      passwordHash,
      phone: '+1234567814',
      position: 'Recruitment Lead',
      departmentId: deptIds.hr,
      supervisorId: hrManager.id, // Reports to HR Manager
      joinDate: '2022-10-01',
      status: 'active',
      role: 'leader',
    }).returning();

    console.log('✅ Created 5 Team Leaders');

    // 4. EMPLOYEES - Report to Leaders, Managers, or Super Admin
    // Employees under Leaders
    await db.insert(employees).values([
      {
        companyId: company.id,
        employeeId: 'EMP-001',
        fullName: 'Jack Sales Rep',
        email: 'jack.employee@company.com',
        passwordHash,
        phone: '+1234567820',
        position: 'Sales Representative',
        departmentId: deptIds.sales,
        supervisorId: salesLeader1.id, // Reports to Sales Team Lead
        joinDate: '2023-01-01',
        status: 'active',
        role: 'employee',
      },
      {
        companyId: company.id,
        employeeId: 'EMP-002',
        fullName: 'Kate Sales Rep',
        email: 'kate.employee@company.com',
        passwordHash,
        phone: '+1234567821',
        position: 'Sales Representative',
        departmentId: deptIds.sales,
        supervisorId: salesLeader1.id, // Reports to Sales Team Lead
        joinDate: '2023-02-01',
        status: 'active',
        role: 'employee',
      },
      {
        companyId: company.id,
        employeeId: 'EMP-003',
        fullName: 'Liam Inside Sales',
        email: 'liam.employee@company.com',
        passwordHash,
        phone: '+1234567822',
        position: 'Inside Sales Rep',
        departmentId: deptIds.sales,
        supervisorId: salesLeader2.id, // Reports to Inside Sales Lead
        joinDate: '2023-03-01',
        status: 'active',
        role: 'employee',
      },
      {
        companyId: company.id,
        employeeId: 'EMP-004',
        fullName: 'Mary Frontend Dev',
        email: 'mary.employee@company.com',
        passwordHash,
        phone: '+1234567823',
        position: 'Frontend Developer',
        departmentId: deptIds.tech,
        supervisorId: techLeader1.id, // Reports to Frontend Team Lead
        joinDate: '2023-04-01',
        status: 'active',
        role: 'employee',
      },
      {
        companyId: company.id,
        employeeId: 'EMP-005',
        fullName: 'Nathan Frontend Dev',
        email: 'nathan.employee@company.com',
        passwordHash,
        phone: '+1234567824',
        position: 'Frontend Developer',
        departmentId: deptIds.tech,
        supervisorId: techLeader1.id, // Reports to Frontend Team Lead
        joinDate: '2023-05-01',
        status: 'active',
        role: 'employee',
      },
      {
        companyId: company.id,
        employeeId: 'EMP-006',
        fullName: 'Olivia Backend Dev',
        email: 'olivia.employee@company.com',
        passwordHash,
        phone: '+1234567825',
        position: 'Backend Developer',
        departmentId: deptIds.tech,
        supervisorId: techLeader2.id, // Reports to Backend Team Lead
        joinDate: '2023-06-01',
        status: 'active',
        role: 'employee',
      },
      {
        companyId: company.id,
        employeeId: 'EMP-007',
        fullName: 'Paul Backend Dev',
        email: 'paul.employee@company.com',
        passwordHash,
        phone: '+1234567826',
        position: 'Backend Developer',
        departmentId: deptIds.tech,
        supervisorId: techLeader2.id, // Reports to Backend Team Lead
        joinDate: '2023-07-01',
        status: 'active',
        role: 'employee',
      },
      {
        companyId: company.id,
        employeeId: 'EMP-008',
        fullName: 'Quinn Recruiter',
        email: 'quinn.employee@company.com',
        passwordHash,
        phone: '+1234567827',
        position: 'Technical Recruiter',
        departmentId: deptIds.hr,
        supervisorId: hrLeader.id, // Reports to Recruitment Lead
        joinDate: '2023-08-01',
        status: 'active',
        role: 'employee',
      },
    ]);

    // Employees reporting directly to Managers (skipping Leader level)
    await db.insert(employees).values([
      {
        companyId: company.id,
        employeeId: 'EMP-009',
        fullName: 'Rachel Executive Assistant',
        email: 'rachel.employee@company.com',
        passwordHash,
        phone: '+1234567828',
        position: 'Executive Assistant',
        departmentId: deptIds.executive,
        supervisorId: superAdmin.id, // Reports directly to CEO
        joinDate: '2023-09-01',
        status: 'active',
        role: 'employee',
      },
      {
        companyId: company.id,
        employeeId: 'EMP-010',
        fullName: 'Steve HR Specialist',
        email: 'steve.employee@company.com',
        passwordHash,
        phone: '+1234567829',
        position: 'HR Specialist',
        departmentId: deptIds.hr,
        supervisorId: hrManager.id, // Reports directly to HR Manager
        joinDate: '2023-10-01',
        status: 'active',
        role: 'employee',
      },
    ]);

    console.log('✅ Created 10 Employees');

    console.log(`
    🎉 Role hierarchy seed completed successfully!

    Organizational Structure:
    └── Super Admin (CEO)
        ├── Sales Manager (Director)
        │   ├── Regional Manager
        │   │   └── Sales Team Lead
        │   │       ├── Sales Rep 1
        │   │       └── Sales Rep 2
        │   └── Inside Sales Lead
        │       └── Inside Sales Rep
        ├── Tech Manager (Director)
        │   ├── Frontend Team Lead
        │   │   ├── Frontend Dev 1
        │   │   └── Frontend Dev 2
        │   └── Backend Team Lead
        │       ├── Backend Dev 1
        │       └── Backend Dev 2
        ├── HR Manager (Director)
        │   ├── Recruitment Lead
        │   │   └── Technical Recruiter
        │   └── HR Specialist (Direct report)
        └── Executive Assistant (Direct report)

    Test Accounts (all passwords: password123):

    🔴 Super Admin:
    - john.ceo@company.com (CEO - Full access)

    🟠 Managers:
    - alice.manager@company.com (Sales Director)
    - bob.manager@company.com (Engineering Director)
    - carol.manager@company.com (HR Director)
    - diana.manager@company.com (Regional Sales Manager)

    🟡 Team Leaders:
    - eric.leader@company.com (Sales Team Lead)
    - fiona.leader@company.com (Inside Sales Lead)
    - george.leader@company.com (Frontend Team Lead)
    - helen.leader@company.com (Backend Team Lead)
    - ian.leader@company.com (Recruitment Lead)

    🟢 Employees:
    - jack.employee@company.com (Sales Rep)
    - mary.employee@company.com (Frontend Dev)
    - olivia.employee@company.com (Backend Dev)
    - quinn.employee@company.com (Recruiter)
    - rachel.employee@company.com (Executive Assistant)

    Permission Levels:
    • Super Admin: Full access to everything
    • Managers: Can manage templates, view all subordinates
    • Leaders: Can view their team members only
    • Employees: Can only view their own information
    `);

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    process.exit(0);
  }
}

seedRoleHierarchy();