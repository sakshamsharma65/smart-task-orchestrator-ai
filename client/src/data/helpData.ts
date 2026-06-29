import { HelpTopic, HelpCategory, HelpScenario, FAQ } from '@/types/help';

export const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the basics of TaskRep',
    icon: 'Rocket',
    order: 1,
    roles: ['admin', 'manager', 'team_manager', 'user']
  },
  {
    id: 'task-management',
    name: 'Task Management',
    description: 'Creating, assigning, and tracking tasks',
    icon: 'CheckSquare',
    order: 2,
    roles: ['admin', 'manager', 'team_manager', 'user']
  },
  {
    id: 'user-management',
    name: 'User Management',
    description: 'Managing users, roles, and permissions',
    icon: 'Users',
    order: 3,
    roles: ['admin', 'manager']
  },
  {
    id: 'team-management',
    name: 'Team Management',
    description: 'Creating and managing teams',
    icon: 'Users2',
    order: 4,
    roles: ['admin', 'manager', 'team_manager']
  },
  {
    id: 'reporting',
    name: 'Reports & Analytics',
    description: 'Generating reports and analyzing data',
    icon: 'BarChart3',
    order: 5,
    roles: ['admin', 'manager', 'team_manager']
  },
  {
    id: 'settings',
    name: 'Settings & Configuration',
    description: 'System configuration and preferences',
    icon: 'Settings',
    order: 6,
    roles: ['admin', 'manager']
  },
  {
    id: 'benchmarking',
    name: 'Benchmarking & Productivity',
    description: 'Tracking and analyzing productivity metrics',
    icon: 'TrendingUp',
    order: 7,
    roles: ['admin', 'manager', 'team_manager']
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Common issues and solutions',
    icon: 'AlertCircle',
    order: 8,
    roles: ['admin', 'manager', 'team_manager', 'user']
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Create projects and organize delivery work',
    icon: 'FolderKanban',
    order: 9,
    roles: ['admin', 'manager', 'team_manager', 'user']
  },
  {
    id: 'defect-management',
    name: 'Defect Management',
    description: 'Report, review, and resolve defects',
    icon: 'Bug',
    order: 10,
    roles: ['admin', 'manager', 'team_manager', 'user']
  },
  {
    id: 'client-management',
    name: 'Client Management',
    description: 'Maintain clients, contacts, and linked projects',
    icon: 'Building2',
    order: 11,
    roles: ['admin', 'manager', 'team_manager']
  },
  {
    id: 'client-portal-management',
    name: 'Client Portal Management',
    description: 'Control portal accounts and project access',
    icon: 'ShieldCheck',
    order: 12,
    roles: ['admin', 'manager', 'team_manager']
  }
];

export const helpTopics: HelpTopic[] = [
  // Getting Started
  {
    id: 'first-login',
    title: 'Your First Login',
    content: `
# Welcome to TaskRep!

## What is TaskRep?
TaskRep is a comprehensive task management system designed to help teams collaborate effectively with role-based access control and detailed productivity tracking.

## Your First Steps:
1. **Review Your Dashboard**: Start with the dashboard to see an overview of your tasks and activities
2. **Check Your Profile**: Ensure your profile information is complete
3. **Explore Your Role**: Your permissions are based on your assigned role
4. **Review Active Tasks**: Check what tasks are currently assigned to you

## Key Features:
- **Task Management**: Create, assign, and track tasks with detailed status workflows
- **Team Collaboration**: Work together with team members based on your role
- **Time Tracking**: Monitor time spent on tasks for productivity analysis
- **Reporting**: Generate reports and analyze performance metrics
- **Benchmarking**: Track productivity against organizational standards

## Next Steps:
- Complete the "Creating Your First Task" tutorial
- Set up your notification preferences
- Join your team discussions
`,
    category: 'getting-started',
    role: ['admin', 'manager', 'team_manager', 'user'],
    scenario: ['first-time-user', 'onboarding'],
    context: ['dashboard', 'login'],
    tags: ['welcome', 'introduction', 'basics', 'first-time'],
    difficulty: 'beginner',
    lastUpdated: '2025-07-15',
    relatedTopics: ['dashboard-overview', 'user-roles', 'task-basics']
  },
  
  {
    id: 'dashboard-overview',
    title: 'Understanding Your Dashboard',
    content: `
# Dashboard Overview

## Main Dashboard Components:

### 1. Quick Stats
- **Active Tasks**: Number of tasks currently assigned to you
- **Completed Today**: Tasks you've completed today
- **Overdue Tasks**: Tasks past their due date
- **Team Performance**: Overview of your team's progress

### 2. Tasks Due Today
- Shows all tasks due today with priority indicators
- Click on any task to view details
- Color-coded by priority (Red: High, Orange: Medium, Green: Low)

### 3. Recent Activity
- Latest updates on your tasks
- Team member activities
- System notifications

### 4. Time Tracking
- Active timers for tasks you're working on
- Daily time spent summary
- Weekly productivity trends

## Customizing Your Dashboard:
- Use the settings icon to personalize your view
- Filter information by team, priority, or date range
- Set up notifications for important updates
`,
    category: 'getting-started',
    role: ['admin', 'manager', 'team_manager', 'user'],
    scenario: ['daily-workflow', 'overview'],
    context: ['dashboard'],
    tags: ['dashboard', 'overview', 'navigation', 'stats'],
    difficulty: 'beginner',
    lastUpdated: '2025-07-15',
    relatedTopics: ['first-login', 'task-basics', 'notifications']
  },

  // Task Management
  {
    id: 'creating-tasks',
    title: 'Creating Tasks',
    content: `
# Creating Tasks

## Step-by-Step Guide:

### 1. Navigate to Task Creation
- Go to "Task Management" → "All Tasks"
- Click the "Create Task" button
- Or use the "+" icon in the top navigation

### 2. Fill Required Information
- **Task Title**: Clear, descriptive title
- **Description**: Detailed task requirements
- **Priority**: High, Medium, or Low
- **Estimated Hours**: Time needed to complete
- **Start Date**: When work should begin
- **End Date**: Task deadline

### 3. Assignment & Organization
- **Assign To**: Select team member (based on your role permissions)
- **Task Group**: Organize related tasks together
- **Dependencies**: Link to prerequisite tasks
- **Status**: Usually starts as "To Do"

### 4. Advanced Options
- **Time Management**: Enable for time tracking
- **Attachments**: Add relevant files
- **Tags**: Categorize for easy filtering
- **Comments**: Add initial notes

## Best Practices:
- Use clear, action-oriented titles
- Include acceptance criteria in descriptions
- Set realistic time estimates
- Choose appropriate priority levels
- Link related tasks as dependencies

## Tips for Different Roles:
- **Admin**: Can assign to anyone, create for any team
- **Manager**: Can assign to team members and subordinates
- **Team Manager**: Can assign within their team
- **User**: Can create tasks for themselves or request assignments
`,
    category: 'task-management',
    role: ['admin', 'manager', 'team_manager', 'user'],
    scenario: ['task-creation', 'project-setup', 'daily-workflow'],
    context: ['tasks', 'create-task'],
    tags: ['tasks', 'create', 'assignment', 'workflow'],
    difficulty: 'beginner',
    lastUpdated: '2025-07-15',
    relatedTopics: ['task-assignment', 'task-statuses', 'time-tracking']
  },

  {
    id: 'task-statuses',
    title: 'Understanding Task Statuses',
    content: `
# Task Status Workflow

## Default Status Flow:
1. **To Do** → Ready to start work
2. **In Progress** → Currently being worked on
3. **Review** → Waiting for approval/feedback
4. **Completed** → Task finished successfully

## Status Management:
- **Status Colors**: Each status has a color indicator for easy identification
- **Transitions**: Some statuses may have restricted transitions
- **Permissions**: Your role determines which status changes you can make
- **Automatic Updates**: Some statuses update automatically based on actions

## Status-Specific Actions:
- **To Do**: Start timer, edit task details, assign to team members
- **In Progress**: Log time, add progress comments, request help
- **Review**: Submit for approval, attach deliverables
- **Completed**: View final metrics, add completion notes

## Custom Statuses:
Admins can create custom statuses for specific workflows:
- **Planning**: For tasks in planning phase
- **Blocked**: When task is waiting for dependencies
- **Testing**: For tasks in quality assurance
- **Deployed**: For completed and deployed features

## Status Indicators:
- **Priority Colors**: Red (High), Orange (Medium), Green (Low)
- **Due Date Colors**: Red (Overdue), Orange (Due Soon), Green (On Track)
- **Time Tracking**: Shows if task is actively being timed
`,
    category: 'task-management',
    role: ['admin', 'manager', 'team_manager', 'user'],
    scenario: ['task-workflow', 'status-management'],
    context: ['tasks', 'status'],
    tags: ['status', 'workflow', 'progress', 'management'],
    difficulty: 'intermediate',
    lastUpdated: '2025-07-15',
    relatedTopics: ['creating-tasks', 'time-tracking', 'task-assignment']
  },

  // User Management
  {
    id: 'user-roles',
    title: 'Understanding User Roles',
    content: `
# User Roles & Permissions

## Role Hierarchy:

### 1. Admin
- **Full System Access**: Complete control over all features
- **User Management**: Create, edit, delete users
- **Role Management**: Assign and modify user roles
- **System Settings**: Configure organization-wide settings
- **All Reports**: Access to all reporting features
- **Team Management**: Create and manage all teams

### 2. Manager
- **Team Oversight**: Manage assigned teams and departments
- **User Management**: Limited to their team members
- **Task Assignment**: Assign tasks to team members
- **Reports**: Access to team and individual reports
- **Settings**: Limited configuration options

### 3. Team Manager
- **Team Leadership**: Manage specific team operations
- **Task Coordination**: Assign tasks within their team
- **Team Reports**: Access to team performance metrics
- **Member Support**: Help team members with task issues

### 4. User
- **Task Execution**: Create and manage personal tasks
- **Time Tracking**: Log time on assigned tasks
- **Profile Management**: Update personal information
- **Basic Reports**: Access to personal productivity reports

## Permission Matrix:
| Feature | Admin | Manager | Team Manager | User |
|---------|-------|---------|--------------|------|
| Create Users | ✓ | ✓ (team only) | ✗ | ✗ |
| Assign Tasks | ✓ | ✓ | ✓ (team only) | ✓ (self only) |
| View Reports | ✓ | ✓ | ✓ (team only) | ✓ (self only) |
| System Settings | ✓ | ✗ | ✗ | ✗ |
| Delete Tasks | ✓ | ✓ | ✓ (team only) | ✓ (own only) |

## Role-Based Visibility:
- **Organization Scope**: Admins see all users and data
- **Team Scope**: Managers see their teams and subordinates
- **User Scope**: Regular users see only their own data
`,
    category: 'user-management',
    role: ['admin', 'manager'],
    scenario: ['user-setup', 'permission-management'],
    context: ['admin', 'users', 'roles'],
    tags: ['roles', 'permissions', 'access', 'hierarchy'],
    difficulty: 'intermediate',
    lastUpdated: '2025-07-15',
    relatedTopics: ['creating-users', 'team-management', 'security']
  },

  // Reports & Analytics
  {
    id: 'analytics-dashboard',
    title: 'Analytics Dashboard Overview',
    content: `
# Analytics Dashboard Guide

## Overview:
The Analytics Dashboard provides comprehensive insights into your organization's productivity, task completion rates, and team performance metrics.

## Key Metrics Available:
- **Task Completion Rates**: Track completion percentages by team and individual
- **Time Tracking Analytics**: See actual vs. estimated time spent on tasks
- **Productivity Trends**: Monthly and weekly productivity patterns
- **Team Performance**: Compare team efficiency and output
- **Resource Allocation**: Understand workload distribution across teams

## Dashboard Sections:

### 1. Executive Summary
- Total tasks completed this month
- Average completion time
- Team productivity scores
- Critical metrics overview

### 2. Team Performance
- Individual team performance metrics
- Comparison charts between teams
- Workload distribution analysis
- Team member productivity rankings

### 3. Task Analytics
- Task completion trends over time
- Most common task types
- Average time per task category
- Overdue task analysis

### 4. Time Tracking Insights
- Total hours logged by team/individual
- Efficiency metrics (actual vs. estimated)
- Peak productivity hours
- Time allocation by project/category

## How to Use:
1. Navigate to Reports → Analytics Dashboard
2. Select date range for analysis
3. Choose specific teams or individuals
4. Export reports for presentations
5. Set up automated report delivery

## Best Practices:
- Review weekly for operational insights
- Use monthly data for strategic planning
- Compare teams fairly considering workload
- Focus on trends rather than single data points
`,
    category: 'reporting',
    role: ['admin', 'manager', 'team_manager'],
    scenario: ['performance-review', 'strategic-planning'],
    context: ['reports', 'analytics'],
    tags: ['analytics', 'dashboard', 'metrics', 'performance'],
    difficulty: 'intermediate',
    lastUpdated: '2025-07-15',
    relatedTopics: ['benchmarking-setup', 'team-management', 'task-statuses']
  },

  {
    id: 'benchmarking-reports',
    title: 'Benchmarking Reports',
    content: `
# Benchmarking Reports System

## Overview:
The benchmarking system provides intelligent analysis of employee productivity using advanced query processing and performance metrics.

## Key Features:

### 1. Natural Language Queries
Ask questions in plain English:
- "Who exceeded their weekly hour targets?"
- "Which team has the highest completion rate?"
- "Show me users below benchmark performance"
- "Compare department productivity this month"

### 2. Performance Analysis
- **Individual Performance**: Track each employee against benchmarks
- **Team Comparisons**: Compare team performance metrics
- **Trend Analysis**: See performance changes over time
- **Goal Achievement**: Track progress toward targets

### 3. Productivity Metrics
- **Hours Tracking**: Actual vs. target hours worked
- **Completion Rates**: Task completion percentages
- **Efficiency Scores**: Output quality and speed
- **Workload Balance**: Distribution of work across teams

### 4. Advanced Analytics
- **Percentage-based Analysis**: "Users who exceeded 10% more hours"
- **Comparative Rankings**: Top and bottom performers
- **Department Analytics**: Cross-departmental performance
- **Risk Identification**: Employees at risk of burnout

## Report Types:

### Weekly Performance Report
- Individual productivity scores
- Team achievement summaries
- Trend analysis
- Recommendations for improvement

### Monthly Benchmarking Analysis
- Comprehensive performance review
- Goal achievement tracking
- Resource allocation insights
- Strategic recommendations

### Custom Query Reports
- Natural language query results
- Filtered performance data
- Comparative analysis
- Detailed breakdowns

## How to Generate Reports:
1. Go to Reports → Benchmarking
2. Select report type or enter custom query
3. Choose date range and filters
4. Review results and insights
5. Export or schedule regular delivery

## Best Practices:
- Use consistent measurement periods
- Consider context when interpreting results
- Focus on improvement opportunities
- Regular review and adjustment of benchmarks
`,
    category: 'reporting',
    role: ['admin', 'manager', 'team_manager'],
    scenario: ['performance-review', 'benchmarking-analysis'],
    context: ['reports', 'benchmarking'],
    tags: ['benchmarking', 'reports', 'analytics', 'performance'],
    difficulty: 'advanced',
    lastUpdated: '2025-07-15',
    relatedTopics: ['analytics-dashboard', 'benchmarking-setup', 'user-roles']
  },

  {
    id: 'task-reports',
    title: 'Task Reports & Analysis',
    content: `
# Task Reports System

## Overview:
Generate comprehensive reports on task performance, completion rates, and productivity metrics across your organization.

## Available Reports:

### 1. Task Completion Reports
- **Daily Summaries**: Tasks completed each day
- **Weekly Overviews**: Weekly completion statistics
- **Monthly Analysis**: Monthly productivity trends
- **Project Reports**: Task completion by project

### 2. Time Tracking Reports
- **Time Spent Analysis**: Actual time vs. estimates
- **Efficiency Metrics**: Productivity per hour
- **Overtime Analysis**: Extended work hours tracking
- **Break Down by Category**: Time allocation analysis

### 3. Team Performance Reports
- **Team Productivity**: Overall team performance metrics
- **Individual Contributions**: Personal productivity scores
- **Workload Distribution**: Task assignment balance
- **Collaboration Metrics**: Team interaction analysis

### 4. Status Flow Reports
- **Workflow Analysis**: How tasks move through statuses
- **Bottleneck Identification**: Where tasks get stuck
- **Status Duration**: Time spent in each status
- **Process Optimization**: Workflow improvement opportunities

## Report Filters:
- **Date Range**: Custom date selections
- **Team Selection**: Specific teams or departments
- **Task Categories**: Filter by task types
- **Status Filters**: Focus on specific statuses
- **Priority Levels**: High, medium, low priority tasks
- **User Selection**: Individual or group reports

## Export Options:
- **PDF Reports**: Professional formatted documents
- **Excel Exports**: Detailed data for analysis
- **CSV Data**: Raw data for custom analysis
- **Email Delivery**: Scheduled report delivery

## How to Generate Reports:
1. Navigate to Reports → Task Reports
2. Select report type and parameters
3. Choose date range and filters
4. Preview report before generating
5. Export in desired format
6. Schedule regular delivery if needed

## Best Practices:
- Regular weekly reviews for operational insights
- Monthly analysis for strategic planning
- Compare performance across similar time periods
- Use filters to focus on specific areas
- Archive reports for historical comparison
`,
    category: 'reporting',
    role: ['admin', 'manager', 'team_manager'],
    scenario: ['task-analysis', 'performance-review'],
    context: ['reports', 'tasks'],
    tags: ['reports', 'tasks', 'analysis', 'productivity'],
    difficulty: 'intermediate',
    lastUpdated: '2025-07-15',
    relatedTopics: ['analytics-dashboard', 'task-statuses', 'time-tracking']
  },

  // Benchmarking
  {
    id: 'benchmarking-setup',
    title: 'Setting Up Benchmarking',
    content: `
# Benchmarking System Setup

## Overview:
The benchmarking system tracks employee productivity against organizational standards to ensure optimal performance and identify improvement opportunities.

## Configuration Steps:

### 1. Organization Settings
- **Daily Hour Limits**: Set minimum and maximum hours per day
- **Weekly Targets**: Define weekly hour requirements
- **Monthly Goals**: Set monthly productivity targets
- **User Overrides**: Allow custom targets for specific users

### 2. User-Level Configuration
- **Custom Targets**: Set individual goals for specific users
- **Exclusions**: Exclude certain users from benchmarking
- **Role-Based Defaults**: Different targets for different roles

### 3. Reporting Configuration
- **Frequency**: Daily, weekly, or monthly reports
- **Recipients**: Who receives benchmarking reports
- **Thresholds**: When to trigger alerts or notifications

## Key Metrics:
- **Daily Hours**: Average hours worked per day
- **Weekly Hours**: Total hours per week
- **Task Completion**: Rate of task completion
- **Efficiency**: Tasks completed per hour
- **Consistency**: Meeting targets consistently

## Advanced Queries:
The system supports natural language queries like:
- "Show me users who exceeded 10% more hours than target"
- "Find team members below benchmark"
- "Users with highest completion rates"
- "Department performance comparison"

## Best Practices:
- Set realistic targets based on role and experience
- Regular review and adjustment of benchmarks
- Use data for coaching, not punishment
- Consider context when interpreting results
`,
    category: 'benchmarking',
    role: ['admin', 'manager'],
    scenario: ['performance-tracking', 'productivity-analysis'],
    context: ['admin', 'settings', 'benchmarking'],
    tags: ['benchmarking', 'productivity', 'metrics', 'performance'],
    difficulty: 'advanced',
    lastUpdated: '2025-07-15',
    relatedTopics: ['time-tracking', 'reporting', 'user-management']
  },

  {
    id: 'benchmarking-query-patterns',
    title: 'Benchmarking Query Patterns Guide',
    content: `
# Benchmarking Query Patterns Guide

## Overview:
The benchmarking system uses natural language processing to understand and analyze productivity queries. This guide shows all supported query patterns and provides examples for each.

## Query Categories:

### 1. Time-Based Analysis
Use natural date expressions to filter data:
- **Examples**: "users from last month", "tasks from this week", "last week performance"
- **Keywords**: last month, this week, last week, previous month, this month

### 2. Role-Based Analysis
Filter by user roles:
- **Manager Analysis**: "show me task data for managers", "manager performance"
- **Admin Analysis**: "admin task statistics", "administrator workload"
- **Regular Users**: "regular user performance", "user task analysis"

### 3. Percentage Analysis
Find performance outliers:
- **Exceeding Targets**: "users who surpassed hours by more than 20%"
- **Below Targets**: "users who fell short by more than 15%"
- **Keywords**: surpass, exceed, short, below, over, under

### 4. Numerical Analysis
Filter by specific thresholds:
- **Task Counts**: "users with more than 5 tasks", "less than 3 tasks"
- **Hour Limits**: "users working over 40 hours", "under 8 hours daily"

### 5. Comparative Analysis
Compare against averages:
- **Above Average**: "users performing above average"
- **Below Average**: "below average performers"
- **Department Comparison**: "users outperforming department average"

### 6. Advanced Patterns
Complex analytical queries:
- **Completion Rates**: "users with high completion rates"
- **Goal Achievement**: "users achieving goals consistently"
- **Risk Detection**: "users at risk of burnout"
- **Workload Distribution**: "workload balance across teams"

## Best Practices:
- Use natural language - the system understands conversational queries
- Combine concepts: "managers who worked more than 40 hours last week"
- Be specific about time periods for accurate results
- Use percentage queries to find outliers
- Try different phrasings if a query doesn't work as expected

## Example Queries:
- "Show me task data for managers in system"
- "Users who exceeded hours by more than 25%"
- "Team members below benchmark last month"
- "Users with high completion rates this week"
- "Department performance comparison"
- "Users at risk of burnout"
`,
    category: 'benchmarking',
    role: ['admin', 'manager', 'team_manager'],
    scenario: ['performance-analysis', 'productivity-tracking'],
    context: ['benchmarking', 'queries', 'analysis'],
    tags: ['benchmarking', 'queries', 'natural-language', 'analysis'],
    difficulty: 'intermediate',
    lastUpdated: '2025-07-15',
    relatedTopics: ['benchmarking-setup', 'reporting', 'performance-analysis'],
    customComponent: 'BenchmarkingQueryGuide'
  },

  // Project Management
  {
    id: 'creating-projects',
    title: 'Creating and Confirming Projects',
    content: `
# Creating and Confirming Projects

## Create the project
1. Open **Project Management → Projects**
2. Select **New Project**
3. Enter the name, description, timeline, effort, and budget
4. Choose **Internal Project** or **Client Project**
5. Select a project template or set the project type manually

Client projects require an active or prospect client. Project types include Fixed Cost, Time & Material, Milestone-Based, and Retainer.

## Confirm the project
Review the project setup, then select **Confirm Project**. Confirmation changes the project to Active and locks its template.

## Access notes
- Admins create projects
- Project managers and authorized members manage assigned projects
- Other users only see projects available through their membership or reporting scope
`,
    category: 'project-management',
    role: ['admin', 'manager', 'team_manager', 'user'],
    scenario: ['project-setup-and-confirmation'],
    context: ['projects', 'projects/new'],
    tags: ['projects', 'create', 'template', 'confirmation', 'client-project'],
    difficulty: 'beginner',
    lastUpdated: '2026-06-29',
    relatedTopics: ['managing-project-work', 'managing-clients', 'setting-up-client-portal-access']
  },

  {
    id: 'managing-project-work',
    title: 'Managing Work Inside a Project',
    content: `
# Managing Work Inside a Project

Open a project to manage delivery from one place.

## Project tabs
- **Overview**: Dates, budget, effort, client, and progress
- **Members**: Project managers, team members, client contacts, allocation, and history
- **Milestones**: Delivery milestones and their stages
- **Features**: Feature groups, features, and progress status
- **Tasks**: Project tasks grouped by milestone
- **Defects**: Issues reported against the project

## Recommended flow
1. Add the project manager and delivery members
2. Create milestones and stages
3. Organize features into groups
4. Create tasks and connect them to milestones or features
5. Track defects and project reports

Management actions depend on project access. A user may be able to view a project without being allowed to change its structure.
`,
    category: 'project-management',
    role: ['admin', 'manager', 'team_manager', 'user'],
    scenario: ['project-setup-and-confirmation', 'daily-task-workflow'],
    context: ['projects', 'project-detail'],
    tags: ['projects', 'members', 'milestones', 'features', 'tasks', 'defects'],
    difficulty: 'intermediate',
    lastUpdated: '2026-06-29',
    relatedTopics: ['creating-projects', 'reporting-defects', 'linking-clients-to-projects']
  },

  // Defect Management
  {
    id: 'reporting-defects',
    title: 'Reporting and Finding Defects',
    content: `
# Reporting and Finding Defects

## Report a defect
1. Open **Defect Management → Defects**
2. Select **Report Defect**
3. Enter a clear title and reproduction details
4. Set severity, priority, type, and environment
5. Select the related project and milestone
6. Add an assignee, team, due date, feature group, or feature when relevant

The defect is saved as a Draft. Open it and select **Submit for Approval** when the details are ready.

## Find defects
- **Defects** provides search, filters, details, and Excel export
- **Defect Board** groups defects by workflow status
- **My Defects** shows defects you reported or that are assigned to you

Include exact steps, expected behaviour, and actual behaviour so the issue can be reproduced quickly.
`,
    category: 'defect-management',
    role: ['admin', 'manager', 'team_manager', 'user'],
    scenario: ['defect-report-to-resolution'],
    context: ['defects', 'defects/board', 'defects/my'],
    tags: ['defects', 'report', 'severity', 'environment', 'draft', 'filters'],
    difficulty: 'beginner',
    lastUpdated: '2026-06-29',
    relatedTopics: ['defect-review-and-resolution', 'managing-project-work', 'creating-tasks']
  },

  {
    id: 'defect-review-and-resolution',
    title: 'Reviewing and Resolving Defects',
    content: `
# Reviewing and Resolving Defects

## Approval workflow
1. The reporter submits a Draft or resubmits a Rejected defect
2. A manager, team manager, or admin reviews it
3. Assign a root-cause category before approval
4. Approve the defect or reject it with a useful reason

## Track the fix
After approval, privileged users can:
- Convert the defect into a new linked task
- Link an existing open task
- Assign ownership and a due date
- Add resolution notes and comments

## Status flow
**Draft → Submitted → Approved → In Progress → Resolved → Verified → Closed**

Rejected defects return to the reporter. Resolved or closed defects can be reopened when the issue occurs again.
`,
    category: 'defect-management',
    role: ['admin', 'manager', 'team_manager', 'user'],
    scenario: ['defect-report-to-resolution'],
    context: ['defects', 'defect-details'],
    tags: ['defects', 'approval', 'root-cause', 'linked-task', 'resolution', 'status'],
    difficulty: 'intermediate',
    lastUpdated: '2026-06-29',
    relatedTopics: ['reporting-defects', 'creating-tasks', 'task-statuses']
  },

  // Client Management
  {
    id: 'managing-clients',
    title: 'Managing Client Records',
    content: `
# Managing Client Records

Client records hold organization details used by client projects and portal contacts.

## Create or update a client
1. Open **Project Management → Clients**
2. Admins can select **New Client**
3. Enter the organization name, type, industry, and status
4. Add primary contact details and internal notes
5. Open the client record for its overview, contacts, and project access

Client statuses are Active, Prospect, and Inactive. Active and prospect clients can be selected when creating a client project.

Deleting a client also removes its contacts and their project access, so confirm that the record is no longer required.
`,
    category: 'client-management',
    role: ['admin', 'manager', 'team_manager'],
    scenario: ['onboard-client-to-portal'],
    context: ['clients'],
    tags: ['clients', 'organization', 'primary-contact', 'status', 'notes'],
    difficulty: 'beginner',
    lastUpdated: '2026-06-29',
    relatedTopics: ['linking-clients-to-projects', 'setting-up-client-portal-access', 'creating-projects']
  },

  {
    id: 'linking-clients-to-projects',
    title: 'Linking Clients, Projects, and Contacts',
    content: `
# Linking Clients, Projects, and Contacts

These records serve different purposes:
- A **client** is the organization
- A **client project** links delivery work to that organization
- A **portal contact** is a person who can sign in
- **Project access** decides which projects that contact can open

## Correct setup order
1. Create the client
2. Create a Client Project and select that client
3. Add portal contacts inside the client record
4. Grant each contact access to the required client projects

Creating a client project does not automatically give every client contact portal access.
`,
    category: 'client-management',
    role: ['admin', 'manager', 'team_manager'],
    scenario: ['onboard-client-to-portal'],
    context: ['clients', 'projects'],
    tags: ['clients', 'client-project', 'contacts', 'project-access'],
    difficulty: 'beginner',
    lastUpdated: '2026-06-29',
    relatedTopics: ['managing-clients', 'creating-projects', 'setting-up-client-portal-access']
  },

  // Client Portal Management
  {
    id: 'setting-up-client-portal-access',
    title: 'Setting Up Client Portal Access',
    content: `
# Setting Up Client Portal Access

## Add a portal contact
1. Open a client and select **Contacts**
2. Add the contact name, email, and optional job title
3. Set an initial password of at least six characters
4. Keep **Account Active** enabled

## Grant project access
1. Open the **Project Access** tab
2. Select **Grant Access**
3. Choose the contact and one of that client's projects
4. Select an access level and review the permissions

## Access levels
- **Observer**: View project information, tasks, and defects
- **Collaborator**: Observer access plus create and edit defects
- **Approver**: Collaborator access plus defect approval, milestone approval, and timesheets

Fine-grained switches can override the preset. Access is granted per contact and per project.
`,
    category: 'client-portal-management',
    role: ['admin', 'manager', 'team_manager'],
    scenario: ['onboard-client-to-portal'],
    context: ['clients', 'project-access', 'portal'],
    tags: ['portal', 'contacts', 'password', 'access-level', 'permissions'],
    difficulty: 'intermediate',
    lastUpdated: '2026-06-29',
    relatedTopics: ['client-portal-experience', 'managing-clients', 'linking-clients-to-projects']
  },

  {
    id: 'client-portal-experience',
    title: 'What Clients Can Do in the Portal',
    content: `
# What Clients Can Do in the Portal

Portal contacts sign in at **/portal/login** with the email and password configured on their contact record.

## Portal dashboard
Clients see only projects explicitly assigned to their contact. Each project card shows its status, access level, and available permissions.

## Project view
- Overview and milestones are available with project access
- Tasks appear only when **View Tasks** is enabled
- Defects appear only when **View Defects** is enabled
- Creating, editing, or approving defects requires the matching permission

Clients can inspect task and defect details, change their password, and sign out. If access is missing or the account is inactive, they should contact the project manager.
`,
    category: 'client-portal-management',
    role: ['admin', 'manager', 'team_manager'],
    scenario: ['onboard-client-to-portal'],
    context: ['portal', 'clients', 'project-access'],
    tags: ['portal', 'dashboard', 'projects', 'tasks', 'defects', 'permissions'],
    difficulty: 'beginner',
    lastUpdated: '2026-06-29',
    relatedTopics: ['setting-up-client-portal-access', 'linking-clients-to-projects', 'reporting-defects']
  }
];

export const helpScenarios: HelpScenario[] = [
  {
    id: 'generate-weekly-report',
    name: 'Generating Weekly Performance Report',
    description: 'Step-by-step process to create and distribute weekly team performance reports',
    category: 'reporting',
    steps: [
      {
        id: 'navigate-reports',
        title: 'Navigate to Reports Section',
        description: 'Access the reporting dashboard from the main menu',
        action: 'Go to Reports → Analytics Dashboard',
        tips: [
          'Make sure you have proper permissions for the report type',
          'Check if you need admin or manager access',
          'Verify your role allows viewing team data'
        ]
      },
      {
        id: 'select-parameters',
        title: 'Configure Report Parameters',
        description: 'Choose the appropriate date range and filters for your report',
        action: 'Set date range to last 7 days and select relevant teams',
        tips: [
          'Use consistent date ranges for comparison',
          'Select only teams you manage or have access to',
          'Consider time zones for accurate reporting'
        ]
      },
      {
        id: 'review-data',
        title: 'Review Generated Data',
        description: 'Examine the report results and verify accuracy',
        action: 'Check metrics for completeness and identify any anomalies',
        tips: [
          'Look for unusual patterns or missing data',
          'Verify team member inclusion',
          'Check for any system outages that might affect data'
        ]
      },
      {
        id: 'export-report',
        title: 'Export and Distribute',
        description: 'Export the report in appropriate format and share with stakeholders',
        action: 'Export as PDF or Excel and email to relevant team members',
        tips: [
          'Choose format based on recipient preferences',
          'Include context and analysis with raw data',
          'Set up automated delivery for regular reports'
        ]
      }
    ],
    roles: ['admin', 'manager', 'team_manager'],
    estimatedTime: '10-15 minutes',
    difficulty: 'beginner'
  },

  {
    id: 'benchmarking-analysis',
    name: 'Conducting Benchmarking Analysis',
    description: 'Complete process for analyzing team performance using benchmarking tools',
    category: 'benchmarking',
    steps: [
      {
        id: 'access-benchmarking',
        title: 'Access Benchmarking Reports',
        description: 'Navigate to the benchmarking section and prepare for analysis',
        action: 'Go to Reports → Benchmarking',
        tips: [
          'Ensure benchmarking is enabled for your organization',
          'Check if users have proper benchmark settings',
          'Verify data collection period is sufficient'
        ]
      },
      {
        id: 'formulate-query',
        title: 'Create Natural Language Query',
        description: 'Write clear questions to get specific insights',
        action: 'Enter query like "Which team members exceeded their weekly targets?"',
        tips: [
          'Use specific timeframes in your queries',
          'Ask about percentages for better comparisons',
          'Focus on actionable insights rather than raw numbers'
        ]
      },
      {
        id: 'analyze-results',
        title: 'Interpret Results',
        description: 'Review the analysis results and identify key insights',
        action: 'Examine performance patterns and identify improvement opportunities',
        tips: [
          'Look for trends rather than isolated incidents',
          'Consider external factors affecting performance',
          'Focus on sustainable improvements'
        ]
      },
      {
        id: 'action-planning',
        title: 'Create Action Plan',
        description: 'Develop specific steps based on the analysis',
        action: 'Document findings and create improvement strategies',
        tips: [
          'Set specific, measurable goals',
          'Include timelines for implementation',
          'Consider individual vs. team-level interventions'
        ]
      }
    ],
    roles: ['admin', 'manager', 'team_manager'],
    estimatedTime: '20-30 minutes',
    difficulty: 'intermediate'
  },
  {
    id: 'onboarding-new-user',
    name: 'Onboarding a New User',
    description: 'Complete process for adding and setting up a new team member',
    category: 'user-management',
    steps: [
      {
        id: 'create-user-account',
        title: 'Create User Account',
        description: 'Add the new user to the system with basic information',
        action: 'Go to Admin → Users → Create User',
        tips: [
          'Use the user\'s work email address',
          'Set a temporary password they can change later',
          'Include their department and phone number'
        ]
      },
      {
        id: 'assign-role',
        title: 'Assign Appropriate Role',
        description: 'Set the user\'s role based on their responsibilities',
        action: 'In user details, click "Change Role"',
        tips: [
          'Consider their seniority and responsibilities',
          'Most new employees start with "User" role',
          'Managers should get "Manager" or "Team Manager" role'
        ]
      },
      {
        id: 'add-to-team',
        title: 'Add to Team',
        description: 'Assign the user to their appropriate team',
        action: 'Go to Admin → Teams → Select Team → Add Member',
        tips: [
          'Users can be on multiple teams',
          'Set their role within the team',
          'Consider their reporting structure'
        ]
      },
      {
        id: 'set-benchmarks',
        title: 'Configure Benchmarking',
        description: 'Set productivity targets if different from defaults',
        action: 'In user profile, edit benchmarking settings',
        tips: [
          'New employees may need adjusted targets',
          'Consider their experience level',
          'Review targets after 90 days'
        ]
      },
      {
        id: 'first-task-assignment',
        title: 'Assign First Task',
        description: 'Create an initial task to get them started',
        action: 'Create a simple, well-defined task',
        tips: [
          'Make it achievable and clear',
          'Include detailed instructions',
          'Set a reasonable timeline'
        ]
      }
    ],
    roles: ['admin', 'manager'],
    estimatedTime: '15-20 minutes',
    difficulty: 'intermediate'
  },
  
  {
    id: 'daily-task-workflow',
    name: 'Daily Task Management Workflow',
    description: 'How to efficiently manage tasks throughout the day',
    category: 'task-management',
    steps: [
      {
        id: 'morning-review',
        title: 'Morning Task Review',
        description: 'Start your day by reviewing tasks and priorities',
        action: 'Check Dashboard → Tasks Due Today',
        tips: [
          'Review overnight updates and comments',
          'Prioritize based on urgency and importance',
          'Check for any blockers or dependencies'
        ]
      },
      {
        id: 'start-work',
        title: 'Begin Working on Tasks',
        description: 'Start timer and begin work on highest priority task',
        action: 'Click task → Start Timer → Begin work',
        tips: [
          'Focus on one task at a time',
          'Update status to "In Progress"',
          'Add comments for significant progress'
        ]
      },
      {
        id: 'progress-updates',
        title: 'Regular Progress Updates',
        description: 'Update task status and add comments throughout the day',
        action: 'Add comments and update status as needed',
        tips: [
          'Update every few hours or at major milestones',
          'Be specific about progress and challenges',
          'Tag team members if input is needed'
        ]
      },
      {
        id: 'end-of-day',
        title: 'End of Day Wrap-up',
        description: 'Stop timers and prepare for next day',
        action: 'Stop all timers → Update task statuses → Plan tomorrow',
        tips: [
          'Stop all active timers',
          'Update task statuses accurately',
          'Leave notes for tomorrow\'s priorities'
        ]
      }
    ],
    roles: ['admin', 'manager', 'team_manager', 'user'],
    estimatedTime: 'Ongoing throughout day',
    difficulty: 'beginner'
  },

  {
    id: 'project-setup-and-confirmation',
    name: 'Set Up and Confirm a Project',
    description: 'Create a project, organize its delivery structure, and confirm it',
    category: 'project-management',
    steps: [
      {
        id: 'create-project-record',
        title: 'Create the Project',
        description: 'Enter the project scope, type, timeline, and budget.',
        action: 'Go to Project Management → Projects → New Project',
        tips: [
          'Select the client before saving a client project',
          'Choose the template carefully because it locks after confirmation'
        ]
      },
      {
        id: 'add-project-members',
        title: 'Add Members',
        description: 'Add the project manager and the people responsible for delivery.',
        action: 'Open the project → Members → Add Member',
        tips: [
          'Use allocation percentage to show planned availability',
          'Client contacts can be added as project members'
        ]
      },
      {
        id: 'organize-project-delivery',
        title: 'Organize Delivery',
        description: 'Create milestones, stages, feature groups, and features.',
        action: 'Complete the Milestones and Features tabs',
        tips: [
          'Group tasks under milestones for clearer progress tracking',
          'Use feature groups for modules or major work areas'
        ]
      },
      {
        id: 'confirm-project',
        title: 'Confirm the Project',
        description: 'Review the setup and activate the project.',
        action: 'Select Confirm Project',
        warnings: [
          'The project template cannot be changed after confirmation'
        ]
      }
    ],
    roles: ['admin'],
    estimatedTime: '10-15 minutes',
    difficulty: 'intermediate'
  },

  {
    id: 'defect-report-to-resolution',
    name: 'Move a Defect from Report to Resolution',
    description: 'Report, review, fix, verify, and close a defect',
    category: 'defect-management',
    steps: [
      {
        id: 'record-defect',
        title: 'Record the Defect',
        description: 'Capture the issue, classification, reproduction details, and project linkage.',
        action: 'Open Defects → Report Defect',
        tips: [
          'State the expected and actual behaviour clearly',
          'Choose the environment where the issue occurred'
        ]
      },
      {
        id: 'submit-defect',
        title: 'Submit for Review',
        description: 'Open the saved draft and send it to a manager.',
        action: 'Select Submit for Approval',
        tips: [
          'Resolve missing information before submitting',
          'Rejected defects can be updated and resubmitted'
        ]
      },
      {
        id: 'review-defect',
        title: 'Review and Approve',
        description: 'A manager checks the report and assigns a root-cause category.',
        action: 'Edit the root cause, then Approve or Reject',
        warnings: [
          'A root-cause category is required before approval'
        ]
      },
      {
        id: 'track-defect-fix',
        title: 'Track the Fix',
        description: 'Convert or link a task, then progress the defect through resolution.',
        action: 'Move through In Progress → Resolved → Verified → Closed',
        tips: [
          'Add resolution notes before marking the defect resolved',
          'Reopen the defect if verification fails'
        ]
      }
    ],
    roles: ['admin', 'manager', 'team_manager', 'user'],
    estimatedTime: '5-10 minutes plus fix time',
    difficulty: 'beginner'
  },

  {
    id: 'create-client-and-link-project',
    name: 'Create a Client and Link a Project',
    description: 'Set up a client record and associate delivery work with it',
    category: 'client-management',
    steps: [
      {
        id: 'create-client-record',
        title: 'Create the Client',
        description: 'Add the organization and primary contact details.',
        action: 'Go to Project Management → Clients → New Client',
        tips: [
          'Use Prospect when the relationship is not active yet',
          'Keep internal notes concise and relevant'
        ]
      },
      {
        id: 'create-client-project',
        title: 'Create a Client Project',
        description: 'Create the delivery project and connect it to the client.',
        action: 'Select New Project → Client Project → choose the client',
        warnings: [
          'Only active or prospect clients are available for selection'
        ]
      },
      {
        id: 'verify-client-link',
        title: 'Verify the Link',
        description: 'Check that the project appears on the client record.',
        action: 'Open the client and review its project information',
        nextSteps: [
          'Add portal contacts if the client needs external access'
        ]
      }
    ],
    roles: ['admin', 'manager', 'team_manager'],
    estimatedTime: '5-10 minutes',
    difficulty: 'beginner'
  },

  {
    id: 'onboard-client-to-portal',
    name: 'Onboard a Contact to the Client Portal',
    description: 'Create a portal account and grant project-specific permissions',
    category: 'client-portal-management',
    steps: [
      {
        id: 'add-portal-contact',
        title: 'Add the Portal Contact',
        description: 'Create the contact under the correct client.',
        action: 'Open Client → Contacts → Add Contact',
        tips: [
          'Use a unique, valid email address',
          'Set a temporary password of at least six characters'
        ]
      },
      {
        id: 'activate-portal-account',
        title: 'Activate the Account',
        description: 'Confirm that the contact can authenticate.',
        action: 'Enable Account Active and save the contact',
        warnings: [
          'Inactive contacts cannot sign in'
        ]
      },
      {
        id: 'grant-contact-project-access',
        title: 'Grant Project Access',
        description: 'Choose exactly which client project the contact can open.',
        action: 'Open Project Access → Grant Access',
        tips: [
          'Start with the closest access-level preset',
          'Review fine-grained permissions before saving'
        ]
      },
      {
        id: 'verify-portal-view',
        title: 'Verify the Portal View',
        description: 'Confirm that the contact can see the intended project and features.',
        action: 'Sign in at /portal/login and open the assigned project',
        nextSteps: [
          'Ask the contact to change the temporary password',
          'Adjust or revoke access when responsibilities change'
        ]
      }
    ],
    roles: ['admin', 'manager', 'team_manager'],
    estimatedTime: '5-10 minutes',
    difficulty: 'intermediate'
  }
];

export const helpFAQs: FAQ[] = [
  {
    id: 'password-reset',
    question: 'How do I reset my password?',
    answer: 'Contact your system administrator to reset your password. Admins can reset passwords through the User Management section.',
    category: 'getting-started',
    roles: ['admin', 'manager', 'team_manager', 'user'],
    popularity: 95,
    lastUpdated: '2025-07-15',
    relatedTopics: ['first-login', 'user-management']
  },
  
  {
    id: 'task-assignment-permissions',
    question: 'Why can\'t I assign tasks to certain users?',
    answer: 'Task assignment is based on your role permissions. Users can only assign tasks to themselves, Team Managers can assign within their team, Managers can assign to their team members and subordinates, and Admins can assign to anyone.',
    category: 'task-management',
    roles: ['admin', 'manager', 'team_manager', 'user'],
    popularity: 88,
    lastUpdated: '2025-07-15',
    relatedTopics: ['user-roles', 'creating-tasks', 'task-assignment']
  },
  
  {
    id: 'time-tracking-accuracy',
    question: 'How accurate is the time tracking?',
    answer: 'Time tracking is accurate to the minute. The system tracks actual time spent working on tasks when timers are active. Make sure to start/stop timers properly to ensure accurate tracking.',
    category: 'task-management',
    roles: ['admin', 'manager', 'team_manager', 'user'],
    popularity: 82,
    lastUpdated: '2025-07-15',
    relatedTopics: ['time-tracking', 'benchmarking-setup', 'task-workflow']
  },
  
  {
    id: 'benchmarking-queries',
    question: 'What kind of queries can I use in the benchmarking report?',
    answer: 'The benchmarking system supports natural language queries like "users who exceeded 10% more hours", "team members below benchmark", "highest completion rates", and "department performance comparison". You can ask about hours, completion rates, team performance, and efficiency metrics. For detailed patterns, see the Benchmarking Query Guide.',
    category: 'benchmarking',
    roles: ['admin', 'manager', 'team_manager'],
    popularity: 75,
    lastUpdated: '2025-07-15',
    relatedTopics: ['benchmarking-setup', 'reporting', 'performance-analysis', 'benchmarking-query-patterns']
  },

  {
    id: 'report-access-permissions',
    question: 'Why can\'t I access certain reports?',
    answer: 'Report access is based on your role permissions. Admins can access all reports, Managers can view team and individual reports for their teams, Team Managers can access reports for their specific team, and regular Users can only view their personal reports. Contact your administrator if you need additional access.',
    category: 'reporting',
    roles: ['admin', 'manager', 'team_manager', 'user'],
    popularity: 84,
    lastUpdated: '2025-07-15',
    relatedTopics: ['user-roles', 'analytics-dashboard', 'permissions']
  },

  {
    id: 'export-report-formats',
    question: 'What formats can I export reports in?',
    answer: 'Reports can be exported in multiple formats: PDF for professional presentations, Excel for detailed data analysis, CSV for raw data import into other systems, and you can also set up automated email delivery for regular reports. Choose the format that best suits your needs.',
    category: 'reporting',
    roles: ['admin', 'manager', 'team_manager'],
    popularity: 78,
    lastUpdated: '2025-07-15',
    relatedTopics: ['analytics-dashboard', 'task-reports', 'benchmarking-reports']
  },

  {
    id: 'report-scheduling',
    question: 'Can I schedule reports to be sent automatically?',
    answer: 'Yes, you can set up automated report delivery through the Reports section. Choose your report type, set the frequency (daily, weekly, monthly), select recipients, and configure the delivery format. This is perfect for regular team updates and management reviews.',
    category: 'reporting',
    roles: ['admin', 'manager', 'team_manager'],
    popularity: 81,
    lastUpdated: '2025-07-15',
    relatedTopics: ['analytics-dashboard', 'task-reports', 'team-management']
  },

  {
    id: 'report-data-accuracy',
    question: 'How do I ensure my reports show accurate data?',
    answer: 'Report accuracy depends on proper time tracking and task status updates. Ensure team members are using timers correctly, updating task statuses promptly, and logging time accurately. Review data for any anomalies and check for system outages that might affect data collection.',
    category: 'reporting',
    roles: ['admin', 'manager', 'team_manager'],
    popularity: 86,
    lastUpdated: '2025-07-15',
    relatedTopics: ['time-tracking', 'task-statuses', 'analytics-dashboard']
  },
  
  {
    id: 'role-visibility',
    question: 'Why can\'t I see all users in the system?',
    answer: 'User visibility is based on your role scope. Admins see all users, Managers see their teams and subordinates, Team Managers see their team members, and regular Users see only themselves. This is for security and data privacy.',
    category: 'user-management',
    roles: ['admin', 'manager', 'team_manager', 'user'],
    popularity: 79,
    lastUpdated: '2025-07-15',
    relatedTopics: ['user-roles', 'security', 'permissions']
  },
  
  {
    id: 'task-deletion',
    question: 'Can I delete tasks?',
    answer: 'Task deletion permissions depend on your role and the task status. Some task statuses may not allow deletion to maintain audit trails. Admins have full deletion rights, while other roles have limited deletion permissions based on their scope.',
    category: 'task-management',
    roles: ['admin', 'manager', 'team_manager', 'user'],
    popularity: 71,
    lastUpdated: '2025-07-15',
    relatedTopics: ['task-statuses', 'user-roles', 'permissions']
  },

  {
    id: 'defect-saved-as-draft',
    question: 'Why is a newly reported defect saved as Draft?',
    answer: 'Draft status lets the reporter review the details before manager approval. Open the defect and select Submit for Approval when it is ready.',
    category: 'defect-management',
    roles: ['admin', 'manager', 'team_manager', 'user'],
    popularity: 90,
    lastUpdated: '2026-06-29',
    relatedTopics: ['reporting-defects', 'defect-review-and-resolution']
  },

  {
    id: 'defect-approval-permission',
    question: 'Why can\'t I approve a submitted defect?',
    answer: 'Approval is available to admins, managers, and team managers. The defect must be Submitted, and a root-cause category must be assigned before approval.',
    category: 'defect-management',
    roles: ['admin', 'manager', 'team_manager', 'user'],
    popularity: 88,
    lastUpdated: '2026-06-29',
    relatedTopics: ['defect-review-and-resolution', 'reporting-defects']
  },

  {
    id: 'project-visibility-and-management',
    question: 'Why can I view a project but not manage it?',
    answer: 'Viewing and management use different access rules. Admins and authorized project managers can change project structure; other members may only view the project or add permitted work.',
    category: 'project-management',
    roles: ['admin', 'manager', 'team_manager', 'user'],
    popularity: 87,
    lastUpdated: '2026-06-29',
    relatedTopics: ['creating-projects', 'managing-project-work']
  },

  {
    id: 'project-confirmation-effect',
    question: 'What happens when I confirm a project?',
    answer: 'The project becomes Active and its selected template is locked. Review the template and setup before confirming.',
    category: 'project-management',
    roles: ['admin', 'manager', 'team_manager', 'user'],
    popularity: 83,
    lastUpdated: '2026-06-29',
    relatedTopics: ['creating-projects', 'managing-project-work']
  },

  {
    id: 'client-versus-portal-contact',
    question: 'What is the difference between a client and a portal contact?',
    answer: 'A client is the organization. A portal contact is an individual under that client who can receive login credentials and project-specific access.',
    category: 'client-management',
    roles: ['admin', 'manager', 'team_manager'],
    popularity: 89,
    lastUpdated: '2026-06-29',
    relatedTopics: ['managing-clients', 'linking-clients-to-projects']
  },

  {
    id: 'portal-project-not-visible',
    question: 'Why can\'t a portal contact see a client project?',
    answer: 'The contact must be active, have a portal password, and receive explicit access to that project. Linking a project to the client does not grant access automatically.',
    category: 'client-portal-management',
    roles: ['admin', 'manager', 'team_manager'],
    popularity: 94,
    lastUpdated: '2026-06-29',
    relatedTopics: ['setting-up-client-portal-access', 'linking-clients-to-projects']
  },

  {
    id: 'portal-access-levels',
    question: 'What do Observer, Collaborator, and Approver mean?',
    answer: 'Observer is view-focused, Collaborator can also create and edit defects, and Approver adds approval permissions. Fine-grained switches can adjust any preset for a specific project.',
    category: 'client-portal-management',
    roles: ['admin', 'manager', 'team_manager'],
    popularity: 91,
    lastUpdated: '2026-06-29',
    relatedTopics: ['setting-up-client-portal-access', 'client-portal-experience']
  }
];
