import 'dotenv/config';
import { db } from './src/db';
import { companies, employees, kpiTemplates, kpiCriteria, departments } from './src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seedKpiAssignments() {
  try {
    console.log('🌱 Starting KPI assignment seed...');

    // Get the first company
    const [company] = await db.select().from(companies).limit(1);
    if (!company) {
      console.error('No company found. Please run the main seed first.');
      return;
    }

    console.log(`📦 Using company: ${company.name}`);

    // Create departments if they don't exist
    const existingDepts = await db.select().from(departments).where(eq(departments.companyId, company.id));

    let salesDept = existingDepts.find(d => d.name === 'Sales');
    let techDept = existingDepts.find(d => d.name === 'Technology');
    let hrDept = existingDepts.find(d => d.name === 'Human Resources');
    let opsDept = existingDepts.find(d => d.name === 'Operations');

    if (!salesDept) {
      [salesDept] = await db.insert(departments).values({
        companyId: company.id,
        name: 'Sales',
        description: 'Sales and Business Development',
        status: 'active',
      }).returning();
    }

    if (!techDept) {
      [techDept] = await db.insert(departments).values({
        companyId: company.id,
        name: 'Technology',
        description: 'Engineering and Product Development',
        status: 'active',
      }).returning();
    }

    if (!hrDept) {
      [hrDept] = await db.insert(departments).values({
        companyId: company.id,
        name: 'Human Resources',
        description: 'People and Culture',
        status: 'active',
      }).returning();
    }

    if (!opsDept) {
      [opsDept] = await db.insert(departments).values({
        companyId: company.id,
        name: 'Operations',
        description: 'Operations and Logistics',
        status: 'active',
      }).returning();
    }

    // Create specific KPI templates for different roles
    console.log('📋 Creating specialized KPI templates...');

    // Sales Representative Template
    const [salesRepTemplate] = await db.insert(kpiTemplates).values({
      companyId: company.id,
      name: 'Sales Representative KPIs',
      positionType: 'Sales Representative',
      description: 'Performance metrics for sales team members',
      isActive: true,
      commitmentWeight: '25.00',
      contributionWeight: '50.00', // Higher weight on contribution for sales
      characterWeight: '10.00',
      competencyWeight: '15.00',
    }).returning();

    // Add criteria for Sales Rep
    await db.insert(kpiCriteria).values([
      {
        templateId: salesRepTemplate.id,
        angle: 'commitment',
        name: 'Sales Target Achievement',
        description: 'Meeting or exceeding monthly sales targets',
        weight: '60.00',
        sortOrder: 1,
        scoringGuide: '0-3: Below 70% | 4-6: 70-90% | 7-8: 90-100% | 9-10: Above 100%',
      },
      {
        templateId: salesRepTemplate.id,
        angle: 'commitment',
        name: 'Customer Follow-ups',
        description: 'Timely follow-up with leads and customers',
        weight: '40.00',
        sortOrder: 2,
        scoringGuide: '0-3: Irregular | 4-6: Sometimes | 7-8: Usually | 9-10: Always on time',
      },
      {
        templateId: salesRepTemplate.id,
        angle: 'contribution',
        name: 'Revenue Generation',
        description: 'Total revenue generated from sales',
        weight: '50.00',
        sortOrder: 1,
        scoringGuide: '0-3: Below target | 4-6: Near target | 7-8: At target | 9-10: Exceeds target',
      },
      {
        templateId: salesRepTemplate.id,
        angle: 'contribution',
        name: 'New Client Acquisition',
        description: 'Number of new clients brought in',
        weight: '50.00',
        sortOrder: 2,
        scoringGuide: '0-3: 0-2 clients | 4-6: 3-5 clients | 7-8: 6-8 clients | 9-10: 9+ clients',
      },
      {
        templateId: salesRepTemplate.id,
        angle: 'character',
        name: 'Client Relationships',
        description: 'Building and maintaining strong client relationships',
        weight: '100.00',
        sortOrder: 1,
        scoringGuide: '0-3: Poor | 4-6: Fair | 7-8: Good | 9-10: Excellent relationships',
      },
      {
        templateId: salesRepTemplate.id,
        angle: 'competency',
        name: 'Product Knowledge',
        description: 'Understanding of products and services',
        weight: '100.00',
        sortOrder: 1,
        scoringGuide: '0-3: Basic | 4-6: Good | 7-8: Strong | 9-10: Expert level',
      },
    ]);

    // Senior Developer Template
    const [seniorDevTemplate] = await db.insert(kpiTemplates).values({
      companyId: company.id,
      name: 'Senior Developer KPIs',
      positionType: 'Senior Developer',
      description: 'Performance metrics for senior developers',
      isActive: true,
      commitmentWeight: '30.00',
      contributionWeight: '35.00',
      characterWeight: '15.00',
      competencyWeight: '20.00', // Higher competency for technical roles
    }).returning();

    // Add criteria for Senior Developer
    await db.insert(kpiCriteria).values([
      {
        templateId: seniorDevTemplate.id,
        angle: 'commitment',
        name: 'Sprint Commitment',
        description: 'Completing assigned tasks within sprints',
        weight: '50.00',
        sortOrder: 1,
        scoringGuide: '0-3: <70% | 4-6: 70-85% | 7-8: 85-95% | 9-10: 95-100% completion',
      },
      {
        templateId: seniorDevTemplate.id,
        angle: 'commitment',
        name: 'Code Review Participation',
        description: 'Active participation in code reviews',
        weight: '50.00',
        sortOrder: 2,
        scoringGuide: '0-3: Minimal | 4-6: Some | 7-8: Regular | 9-10: Very active',
      },
      {
        templateId: seniorDevTemplate.id,
        angle: 'contribution',
        name: 'Code Quality',
        description: 'Writing clean, maintainable code',
        weight: '40.00',
        sortOrder: 1,
        scoringGuide: '0-3: Many issues | 4-6: Some issues | 7-8: Few issues | 9-10: Excellent quality',
      },
      {
        templateId: seniorDevTemplate.id,
        angle: 'contribution',
        name: 'Technical Innovation',
        description: 'Introducing new technologies or improvements',
        weight: '60.00',
        sortOrder: 2,
        scoringGuide: '0-3: None | 4-6: Minor | 7-8: Significant | 9-10: Major innovations',
      },
      {
        templateId: seniorDevTemplate.id,
        angle: 'character',
        name: 'Mentoring',
        description: 'Helping junior developers grow',
        weight: '100.00',
        sortOrder: 1,
        scoringGuide: '0-3: No mentoring | 4-6: Occasional | 7-8: Regular | 9-10: Excellent mentor',
      },
      {
        templateId: seniorDevTemplate.id,
        angle: 'competency',
        name: 'Technical Skills',
        description: 'Mastery of required technologies',
        weight: '100.00',
        sortOrder: 1,
        scoringGuide: '0-3: Basic | 4-6: Proficient | 7-8: Advanced | 9-10: Expert',
      },
    ]);

    // HR Manager Template
    const [hrManagerTemplate] = await db.insert(kpiTemplates).values({
      companyId: company.id,
      name: 'HR Manager KPIs',
      positionType: 'HR Manager',
      description: 'Performance metrics for HR management',
      isActive: true,
      commitmentWeight: '35.00',
      contributionWeight: '30.00',
      characterWeight: '20.00', // Higher character weight for HR
      competencyWeight: '15.00',
    }).returning();

    // Add criteria for HR Manager
    await db.insert(kpiCriteria).values([
      {
        templateId: hrManagerTemplate.id,
        angle: 'commitment',
        name: 'Recruitment Efficiency',
        description: 'Time to fill open positions',
        weight: '50.00',
        sortOrder: 1,
        scoringGuide: '0-3: >60 days | 4-6: 45-60 days | 7-8: 30-45 days | 9-10: <30 days',
      },
      {
        templateId: hrManagerTemplate.id,
        angle: 'commitment',
        name: 'Policy Compliance',
        description: 'Ensuring company policy adherence',
        weight: '50.00',
        sortOrder: 2,
        scoringGuide: '0-3: Major issues | 4-6: Minor issues | 7-8: Rare issues | 9-10: Full compliance',
      },
      {
        templateId: hrManagerTemplate.id,
        angle: 'contribution',
        name: 'Employee Retention',
        description: 'Maintaining low turnover rates',
        weight: '60.00',
        sortOrder: 1,
        scoringGuide: '0-3: >20% turnover | 4-6: 15-20% | 7-8: 10-15% | 9-10: <10%',
      },
      {
        templateId: hrManagerTemplate.id,
        angle: 'contribution',
        name: 'Training Programs',
        description: 'Developing and implementing training',
        weight: '40.00',
        sortOrder: 2,
        scoringGuide: '0-3: No programs | 4-6: Basic | 7-8: Good | 9-10: Excellent programs',
      },
      {
        templateId: hrManagerTemplate.id,
        angle: 'character',
        name: 'Employee Relations',
        description: 'Managing employee concerns and conflicts',
        weight: '100.00',
        sortOrder: 1,
        scoringGuide: '0-3: Poor | 4-6: Fair | 7-8: Good | 9-10: Excellent relations',
      },
      {
        templateId: hrManagerTemplate.id,
        angle: 'competency',
        name: 'HR Best Practices',
        description: 'Knowledge of HR laws and best practices',
        weight: '100.00',
        sortOrder: 1,
        scoringGuide: '0-3: Basic | 4-6: Good | 7-8: Strong | 9-10: Expert knowledge',
      },
    ]);

    // Operations Manager Template
    const [opsManagerTemplate] = await db.insert(kpiTemplates).values({
      companyId: company.id,
      name: 'Operations Manager KPIs',
      positionType: 'Operations Manager',
      description: 'Performance metrics for operations management',
      isActive: true,
      commitmentWeight: '30.00',
      contributionWeight: '40.00', // Higher contribution for operational efficiency
      characterWeight: '15.00',
      competencyWeight: '15.00',
    }).returning();

    // Add criteria for Operations Manager
    await db.insert(kpiCriteria).values([
      {
        templateId: opsManagerTemplate.id,
        angle: 'commitment',
        name: 'Process Adherence',
        description: 'Following and enforcing operational procedures',
        weight: '100.00',
        sortOrder: 1,
        scoringGuide: '0-3: Poor | 4-6: Fair | 7-8: Good | 9-10: Excellent adherence',
      },
      {
        templateId: opsManagerTemplate.id,
        angle: 'contribution',
        name: 'Cost Reduction',
        description: 'Identifying and implementing cost savings',
        weight: '50.00',
        sortOrder: 1,
        scoringGuide: '0-3: No savings | 4-6: Minor | 7-8: Significant | 9-10: Major savings',
      },
      {
        templateId: opsManagerTemplate.id,
        angle: 'contribution',
        name: 'Efficiency Improvements',
        description: 'Streamlining operations and processes',
        weight: '50.00',
        sortOrder: 2,
        scoringGuide: '0-3: No improvements | 4-6: Minor | 7-8: Good | 9-10: Exceptional',
      },
      {
        templateId: opsManagerTemplate.id,
        angle: 'character',
        name: 'Vendor Relations',
        description: 'Managing vendor and supplier relationships',
        weight: '100.00',
        sortOrder: 1,
        scoringGuide: '0-3: Poor | 4-6: Fair | 7-8: Good | 9-10: Excellent relations',
      },
      {
        templateId: opsManagerTemplate.id,
        angle: 'competency',
        name: 'Operations Management',
        description: 'Knowledge of operations best practices',
        weight: '100.00',
        sortOrder: 1,
        scoringGuide: '0-3: Basic | 4-6: Good | 7-8: Strong | 9-10: Expert knowledge',
      },
    ]);

    console.log('✅ Created 4 specialized KPI templates');

    // Now create employees with assigned KPI templates
    console.log('👥 Creating employees with assigned KPI templates...');

    const passwordHash = await bcrypt.hash('password123', 10);

    // Sales team
    const [salesManager] = await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-SM-001',
      fullName: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      passwordHash,
      phone: '+1234567890',
      position: 'Sales Manager',
      departmentId: salesDept.id,
      kpiTemplateId: salesRepTemplate.id, // Using sales template for manager too
      joinDate: '2023-01-15',
      status: 'active',
      role: 'manager',
    }).returning();

    await db.insert(employees).values([
      {
        companyId: company.id,
        employeeId: 'EMP-SR-001',
        fullName: 'Mike Wilson',
        email: 'mike.wilson@company.com',
        passwordHash,
        phone: '+1234567891',
        position: 'Sales Representative',
        departmentId: salesDept.id,
        supervisorId: salesManager.id,
        kpiTemplateId: salesRepTemplate.id, // Assigned to sales template
        joinDate: '2023-03-01',
        status: 'active',
        role: 'employee',
      },
      {
        companyId: company.id,
        employeeId: 'EMP-SR-002',
        fullName: 'Emma Davis',
        email: 'emma.davis@company.com',
        passwordHash,
        phone: '+1234567892',
        position: 'Sales Representative',
        departmentId: salesDept.id,
        supervisorId: salesManager.id,
        kpiTemplateId: salesRepTemplate.id, // Assigned to sales template
        joinDate: '2023-04-15',
        status: 'active',
        role: 'employee',
      },
    ]);

    // Tech team
    const [techLead] = await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-TL-001',
      fullName: 'Alex Chen',
      email: 'alex.chen@company.com',
      passwordHash,
      phone: '+1234567893',
      position: 'Tech Lead',
      departmentId: techDept.id,
      kpiTemplateId: seniorDevTemplate.id, // Using senior dev template for tech lead
      joinDate: '2022-11-01',
      status: 'active',
      role: 'manager',
    }).returning();

    await db.insert(employees).values([
      {
        companyId: company.id,
        employeeId: 'EMP-SD-001',
        fullName: 'David Kim',
        email: 'david.kim@company.com',
        passwordHash,
        phone: '+1234567894',
        position: 'Senior Developer',
        departmentId: techDept.id,
        supervisorId: techLead.id,
        kpiTemplateId: seniorDevTemplate.id, // Assigned to senior dev template
        joinDate: '2023-02-01',
        status: 'active',
        role: 'employee',
      },
      {
        companyId: company.id,
        employeeId: 'EMP-SD-002',
        fullName: 'Lisa Wang',
        email: 'lisa.wang@company.com',
        passwordHash,
        phone: '+1234567895',
        position: 'Senior Developer',
        departmentId: techDept.id,
        supervisorId: techLead.id,
        kpiTemplateId: seniorDevTemplate.id, // Assigned to senior dev template
        joinDate: '2023-05-15',
        status: 'active',
        role: 'employee',
      },
      {
        companyId: company.id,
        employeeId: 'EMP-JD-001',
        fullName: 'Tom Anderson',
        email: 'tom.anderson@company.com',
        passwordHash,
        phone: '+1234567896',
        position: 'Junior Developer',
        departmentId: techDept.id,
        supervisorId: techLead.id,
        kpiTemplateId: null, // No specific template, will use position-based matching
        joinDate: '2023-07-01',
        status: 'active',
        role: 'employee',
      },
    ]);

    // HR team
    await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-HR-001',
      fullName: 'Rachel Green',
      email: 'rachel.green@company.com',
      passwordHash,
      phone: '+1234567897',
      position: 'HR Manager',
      departmentId: hrDept.id,
      kpiTemplateId: hrManagerTemplate.id, // Assigned to HR manager template
      joinDate: '2023-01-01',
      status: 'active',
      role: 'manager',
    });

    // Operations team
    await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-OM-001',
      fullName: 'James Brown',
      email: 'james.brown@company.com',
      passwordHash,
      phone: '+1234567898',
      position: 'Operations Manager',
      departmentId: opsDept.id,
      kpiTemplateId: opsManagerTemplate.id, // Assigned to ops manager template
      joinDate: '2022-12-01',
      status: 'active',
      role: 'manager',
    });

    // Create an employee without assigned template (will use position-based matching)
    await db.insert(employees).values({
      companyId: company.id,
      employeeId: 'EMP-GN-001',
      fullName: 'Jessica Taylor',
      email: 'jessica.taylor@company.com',
      passwordHash,
      phone: '+1234567899',
      position: 'General Staff',
      departmentId: opsDept.id,
      kpiTemplateId: null, // No assigned template
      joinDate: '2023-06-01',
      status: 'active',
      role: 'employee',
    });

    console.log('✅ Created 10 employees with various KPI template assignments');

    console.log(`
    🎉 Seed completed successfully!

    Summary:
    - 4 Specialized KPI Templates created
    - 10 Employees created with various template assignments
    - Some employees have specific templates assigned
    - Some employees will use position-based matching

    You can now test the KPI template assignment feature!

    Test accounts:
    - Sales Manager: sarah.johnson@company.com / password123
    - Tech Lead: alex.chen@company.com / password123
    - HR Manager: rachel.green@company.com / password123
    - Operations Manager: james.brown@company.com / password123
    `);

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    process.exit(0);
  }
}

seedKpiAssignments();