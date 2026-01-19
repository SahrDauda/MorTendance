# 📚 MorTendance User Guide

**Ministry of Reconciliation Attendance System**  
*Simple. Powerful. Built for Growth.*

---

## 🎯 Who Is This Guide For?

This guide is for everyone using the MorTendance system:
- **👨‍💼 Administrators** - Full system control
- **🏢 Branch Heads** - Leaders assigned to manage branches
- **👥 Group Leaders** - Leaders assigned to manage groups (Senior, Junior, Probation)

---

## 📖 Table of Contents

1. [Getting Started](#-getting-started)
2. [Understanding Your Role](#-understanding-your-role)
3. [Admin Portal Guide](#-admin-portal-guide)
4. [Branch Head Portal Guide](#-branch-head-portal-guide)
5. [Group Leader Portal Guide](#-group-leader-portal-guide)
6. [Common Tasks](#-common-tasks)
7. [Troubleshooting](#-troubleshooting)

---

## 🚀 Getting Started

### How to Log In

1. **Open your browser** and go to your MorTendance URL
2. **Enter your email** (example: `minmarcos@mor.org`)
3. **Enter your password** (minimum 8 characters)
4. **Click "Sign In"**

```
┌─────────────────────────────┐
│   🔐 MorTendance Login      │
├─────────────────────────────┤
│                             │
│  Email: [____________]      │
│  Password: [________]       │
│                             │
│  [ Sign In ]  [ Forgot? ]   │
│                             │
└─────────────────────────────┘
```

### First Time Login?

If this is your first time:
- Your **Admin** will create your account
- You'll receive an email with your login details
- **Change your password** after first login (Settings → Profile)

---

## 👤 Understanding Your Role

MorTendance has a simple hierarchy system:

```
                    ADMIN (Top Level)
                         │
                         │ Adds Leaders
                         │
        ┌────────────────┼────────────────┐
        │                                 │
   BRANCH HEAD                       GROUP HEAD
   (Senior Leader                    (Senior Leader
    assigned to                       assigned to
    manage branch)                    manage group)
        │                                 │
        │                                 │
        └─────────────┬───────────────────┘
                      │
                   LEADERS
                      │
        ┌─────────────┼─────────────┐
        │             │             │
     SENIOR        JUNIOR      PROBATION
     LEADER        LEADER       LEADER
        │             │             │
        └─────────────┼─────────────┘
                      │
                  MEMBERS
```

### 🔑 Understanding the System

**How It Works:**

1. **Admin adds Leaders** to the system (Senior, Junior, or Probation)
2. **Admin assigns Senior Leaders** as:
   - **Branch Head** → Gets access to Branch Head Portal
   - **Group Head** → Gets access to Group Dashboard
3. **Credentials are automatically sent** to the leader's email when assigned
4. Leaders log in and manage their assigned areas

**Note:** Only **Senior Leaders** can be assigned as Branch Heads, Group Heads, or CBS Leaders.

### 🔑 Role Capabilities

| Role | Can Do |
|------|--------|
| **ADMIN** | Everything! Add leaders, assign roles, manage settings, view all reports |
| **BRANCH HEAD** | Manage their branch, view branch reports, oversee groups in their branch |
| **GROUP HEAD** | Manage their group, record attendance for Saturday Fellowship, add members, view group reports |
| **CBS LEADER** | Manage CBS location, record CBS attendance, view CBS reports |

### 🔄 Multi-Role Portal Concept

**Important:** A leader can have multiple roles simultaneously. When this happens:

- ✅ **One login, one portal** - No need for multiple accounts
- ✅ **Combined abilities** - Sidebar shows all assigned sections
- ✅ **Single credential** - Same email and password for all roles

**Examples:**
- Leader is **Branch Head + Group Head** → Portal shows both Branch and Group management sections
- Leader is **Group Head + CBS Leader** → Portal shows both Group and CBS sections
- Leader is **Branch Head + Group Head + CBS Leader** → Portal shows all three sections

**Backend handles this automatically** - Leaders see only what they're assigned to manage.

---

## 🎛️ Admin Portal Guide

**Who:** Administrators with full system access

### Admin Dashboard Overview

When you log in as an Admin, you'll see:

```
┌────────────────────────────────────────────────────────┐
│  📊 Admin Dashboard                    👤 Admin Name   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ 👥 150   │  │ 🛡️ 12    │  │ 🏢 3     │  │ 📍 5   ││
│  │ Members  │  │ Leaders  │  │ Groups   │  │ Branch ││
│  └──────────┘  └──────────┘  └──────────┘  └────────┘│
│                                                        │
│  📈 Recent Activity                                    │
│  ┌──────────────────────────────────────────────────┐ │
│  │ • New member added to Huiothesia                 │ │
│  │ • Attendance recorded for Saturday Fellowship   │ │
│  │ • Leader John assigned to Doxasmus              │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Quick Actions:                                        │
│  [+ Add Leader] [+ Add Group] [📊 Reports] [⚙️ Settings]│
└────────────────────────────────────────────────────────┘
```

### Admin Menu Navigation

```
┌─ SIDEBAR ─────────────────┐
│                           │
│  🏠 Dashboard             │
│  📋 Attendance            │
│  👥 Members               │
│  📊 Reports               │
│                           │
│  ─── ADMIN SECTION ───    │
│  👤 Users                 │
│  🏢 Groups                │
│  📍 Branches              │
│  🏛️ CBS Locations         │
│  📜 Audit Logs            │
│  ⚙️ Settings              │
│                           │
│  👤 Profile               │
│  🚪 Logout                │
└───────────────────────────┘
```

---

### 📋 Admin Task 1: Adding Leaders

**Purpose:** Add new leaders to the system

#### Step-by-Step: Adding a New Leader

1. **Navigate** to **Admin → Users** from the sidebar
2. **Click** the **"+ Add Leader"** button (top right)
3. **Fill in the form:**

```
┌─ Add New Leader ───────────────────────┐
│                                        │
│  Full Name: [___________________]      │
│  Email:     [___________________]      │
│                                        │
│  Leader Type: [▼ Select Type]          │
│               ├─ Senior Leader         │
│               ├─ Junior Leader         │
│               └─ Probation Leader      │
│                                        │
│  [Cancel]              [Add Leader]    │
└────────────────────────────────────────┘
```

4. **Select the leader type** (Senior, Junior, or Probation)
5. **Click "Add Leader"**

**Note:** To assign this leader as a Branch Head or Group Head, go to the respective Branch or Group management page.

#### What Happens When a Leader is Assigned

When you assign a leader to a **Branch** or **Group**, the system automatically:
- Sends their credentials to their email
- Grants them access to their portal
- Notifies them of their assignment

#### Email Sent on Assignment

The leader will receive an email like this when assigned:

```
┌─ Email: Welcome to MorTendance ────────────────────────┐
│                                                        │
│  Subject: Your MorTendance Account                     │
│                                                        │
│  Hi [Leader Name],                                     │
│                                                        │
│  You have been assigned as Group Head for Huiothesia!  │
│                                                        │
│  Login Details:                                        │
│  • Email: leader@example.com                           │
│  • Password: Xy9#mK2pL4qR                              │
│  • Login URL: https://your-mortendance.com             │
│                                                        │
│  Your Role: Senior Leader                              │
│  Assigned To: Huiothesia Group                         │
│                                                        │
│  ⚠️ IMPORTANT: Please change your password after       │
│  your first login (Profile → Change Password)          │
│                                                        │
│  Need help? Contact: admin@mor.org                     │
└────────────────────────────────────────────────────────┘
```

#### Tips for Adding Leaders

- ✅ **Use their work/ministry email** for better tracking
- ✅ **Verify email spelling** before submitting
- ✅ **Assign to Branch/Group** after creating the leader account

---

### 📋 Admin Task 2: Managing Groups

**Purpose:** Create and organize ministry groups (Huiothesia, Doxasmus, Paligenasia, etc.)

#### Step-by-Step: Creating a New Group

1. **Navigate** to **Admin → Groups**
2. **Click "** + Add Group"**
3. **Fill in the details:**

```
┌─ Create Ministry Group ────────────────┐
│                                        │
│  Group Name: [___________________]     │
│  (e.g., Huiothesia, Doxasmus)          │
│                                        │
│  Branch:     [▼ Select Branch]         │
│              ├─ Main Branch            │
│              ├─ North Branch           │
│              └─ South Branch           │
│                                        │
│  Leader:     [▼ Select Leader]         │
│              ├─ John Doe (Senior)      │
│              ├─ Jane Smith (Senior)    │
│              └─ Mark Johnson (Senior)  │
│                                        │
│  [Cancel]              [Create Group]  │
└────────────────────────────────────────┘
```

4. **Select a leader** (required - must be a Senior Leader)
5. **Click "Create Group"**

**Note:** You must assign a Senior Leader when creating a group. The leader will receive their credentials via email after assignment.

#### Managing Existing Groups

```
┌─ Ministry Groups ──────────────────────────────────────┐
│  [+ Add Group]  [🔍 Search...]                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📋 Huiothesia                    👤 John Doe (Leader) │
│     📍 Main Branch                     👥 45 members   │
│     [Edit] [Delete] [View Members] [Reports]           │
│  ─────────────────────────────────────────────────────│
│  📋 Doxasmus                      👤 Jane Smith        │
│     📍 North Branch                    👥 38 members   │
│     [Edit] [Delete] [View Members] [Reports]           │
│  ─────────────────────────────────────────────────────│
│  📋 Paligenasia                   👤 Mark Johnson      │
│     📍 South Branch                    👥 32 members   │
│     [Edit] [Delete] [View Members] [Reports]           │
└────────────────────────────────────────────────────────┘
```

#### Editing a Group

1. **Click "Edit"** on any group
2. **Update** the group name, branch, or leader
3. **Click "Save Changes"**

**Note:** Changing the group leader will send credentials to the new leader and notify the previous leader.

#### Deleting a Group

1. **Click "Delete"** on the group you want to remove
2. **Confirm** the deletion
3. **Warning:** This will remove the group but **not** the members - they will need to be reassigned to another group

---

### 📋 Admin Capabilities: Edit & Delete

**As an Admin, you have full control over the system:**

You can **Edit** or **Delete**:
- ✅ **Leaders** - Update information or remove from system
- ✅ **Groups** - Change name, branch, or assigned leader
- ✅ **Branches** - Update details or remove branches
- ✅ **Members** - Edit personal information or remove members
- ✅ **CBS Locations** - Modify or delete locations
- ✅ **Attendance Records** - Correct mistakes in attendance
- ✅ **System Settings** - Adjust all system configurations

**Important Notes:**
- 🔴 **Deletions are permanent** - Always confirm before deleting
- 📧 **Leaders are notified** when their assignments change
- 👥 **Members must be reassigned** if their group is deleted
- 📊 **Attendance history is preserved** even if members are moved

---

### 📋 Admin Task 3: Managing Branches

**Purpose:** Organize your ministry by physical locations or regions

#### Step-by-Step: Adding a Branch

1. **Navigate** to **Admin → Branches**
2. **Click "+ Add Branch"**
3. **Enter branch details:**

```
┌─ Add New Branch ───────────────────────┐
│                                        │
│  Branch Name: [___________________]    │
│  (e.g., Main Campus, North Region)     │
│                                        │
│  Branch Head: [▼ Select User]          │
│               ├─ John Doe              │
│               ├─ Jane Smith            │
│               └─ (Assign Later)        │
│                                        │
│  [Cancel]              [Create Branch] │
└────────────────────────────────────────┘
```

4. **Assign a Branch Head** (optional)
5. **Click "Create Branch"**

---

### 📋 Admin Task 4: Managing CBS Locations

**CBS = Community Bible Study locations**

#### Step-by-Step: Adding a CBS Location

1. **Navigate** to **Admin → CBS Locations**
2. **Click "+ Add CBS Location"**
3. **Fill in the form:**

```
┌─ Add CBS Location ─────────────────────┐
│                                        │
│  Location Name: [___________________]  │
│  Address:       [___________________]  │
│  District:      [___________________]  │
│                                        │
│  Branch:        [▼ Select Branch]      │
│  Leader:        [▼ Select Leader]      │
│                                        │
│  [Cancel]          [Create Location]   │
└────────────────────────────────────────┘
```

---

### 📋 Admin Task 5: Viewing Audit Logs

**Purpose:** Track all system activities for security and accountability

#### What Are Audit Logs?

Audit logs record **every important action** in the system:
- Who logged in
- Who added/edited/deleted users
- Who recorded attendance
- Who modified settings

#### How to View Audit Logs

1. **Navigate** to **Admin → Audit Logs**
2. **Filter by:**
   - Date range
   - User
   - Action type

```
┌─ System Audit Logs ────────────────────────────────────┐
│  Filter: [Date Range ▼] [User ▼] [Action ▼]  [Search] │
├────────────────────────────────────────────────────────┤
│  📅 Jan 18, 2026 10:30 AM                              │
│  👤 Admin John                                         │
│  ✏️ Created new user: jane@mor.org (Senior Leader)     │
│  ─────────────────────────────────────────────────────│
│  📅 Jan 18, 2026 09:15 AM                              │
│  👤 Leader Jane                                        │
│  ✅ Recorded attendance for Huiothesia (35 present)    │
│  ─────────────────────────────────────────────────────│
│  📅 Jan 17, 2026 08:00 PM                              │
│  👤 Admin John                                         │
│  🗑️ Deleted user: old_user@mor.org                     │
└────────────────────────────────────────────────────────┘
```

---

### 📋 Admin Task 6: System Settings

**Purpose:** Configure system-wide settings

#### Available Settings

1. **Navigate** to **Admin → Settings**
2. **Configure:**

```
┌─ Ministry Settings ────────────────────────────────────┐
│                                                        │
│  📧 Email Notifications                                │
│  ☑️ Send weekly attendance reminders                   │
│  ☑️ Alert when member is absent 3+ weeks               │
│  ☐ Send monthly reports to leaders                    │
│                                                        │
│  ⏰ Attendance Settings                                │
│  Default Cutoff Time: [09:00 AM]                       │
│  Mark as late after: [15 minutes]                      │
│                                                        │
│  📊 Report Settings                                    │
│  Fiscal Year Start: [January ▼]                        │
│  Default Report Period: [Last 30 Days ▼]               │
│                                                        │
│  [Cancel]                          [Save Settings]     │
└────────────────────────────────────────────────────────┘
```

---

## 🏢 Branch Head Portal Guide

**Who:** Branch Heads managing a specific branch

### What Can Branch Heads Do?

```
┌─ Branch Head Capabilities ─────────────────────────────┐
│                                                        │
│  ✅ View all groups in their branch                    │
│  ✅ View all members in their branch                   │
│  ✅ View attendance reports for their branch           │
│  ✅ Assign leaders to groups in their branch           │
│  ✅ Generate branch-wide reports                       │
│                                                        │
│  ❌ Cannot create new branches                         │
│  ❌ Cannot access other branches' data                 │
│  ❌ Cannot manage system settings                      │
└────────────────────────────────────────────────────────┘
```

### Branch Head Dashboard

```
┌────────────────────────────────────────────────────────┐
│  🏢 Main Branch Dashboard          👤 Branch Head Name │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Branch Statistics:                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ 👥 120   │  │ 🏢 3     │  │ 📊 85%   │            │
│  │ Members  │  │ Groups   │  │ Attend.  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                                                        │
│  📋 Groups in This Branch:                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Huiothesia    | 45 members | John Doe (Leader)  │ │
│  │ Doxasmus      | 38 members | Jane Smith         │ │
│  │ Paligenasia   | 37 members | (No Leader)        │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  [View All Members] [Branch Reports] [Assign Leaders]  │
└────────────────────────────────────────────────────────┘
```

### Common Branch Head Tasks

#### Task 1: Assigning a Leader to a Group

1. **Navigate** to **Dashboard** or **Admin → Groups**
2. **Find the group** without a leader
3. **Click "Assign Leader"**
4. **Select from available leaders** in your branch
5. **Click "Assign"**

#### Task 2: Viewing Branch Reports

1. **Navigate** to **Reports**
2. **Select "Branch Report"**
3. **Choose date range**
4. **View or download** the report

```
┌─ Branch Report ────────────────────────────────────────┐
│  Branch: Main Branch                                   │
│  Period: Jan 1 - Jan 18, 2026                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📊 Overall Statistics:                                │
│  • Total Members: 120                                  │
│  • Average Attendance: 85%                             │
│  • New Members This Month: 8                           │
│  • Members at Risk (3+ absences): 5                    │
│                                                        │
│  📋 By Group:                                          │
│  ┌──────────────┬──────────┬────────────┐             │
│  │ Group        │ Members  │ Attendance │             │
│  ├──────────────┼──────────┼────────────┤             │
│  │ Huiothesia   │ 45       │ 88%        │             │
│  │ Doxasmus     │ 38       │ 82%        │             │
│  │ Paligenasia  │ 37       │ 85%        │             │
│  └──────────────┴──────────┴────────────┘             │
│                                                        │
│  [Download PDF] [Download Excel] [Email Report]        │
└────────────────────────────────────────────────────────┘
```

---

## 👥 Group Leader Portal Guide

**Who:** Senior Leaders, Junior Leaders, and Probation Leaders

### What Can Group Leaders Do?

```
┌─ Group Leader Capabilities ────────────────────────────┐
│                                                        │
│  ✅ Record weekly attendance for their group           │
│  ✅ Add new members to their group                     │
│  ✅ View member details and history                    │
│  ✅ Generate group reports                             │
│  ✅ Mark members as present/absent/late                │
│  ✅ Add notes about members                            │
│                                                        │
│  ❌ Cannot access other groups' data                   │
│  ❌ Cannot delete members (contact admin)              │
│  ❌ Cannot change system settings                      │
└────────────────────────────────────────────────────────┘
```

### Leader Dashboard

```
┌────────────────────────────────────────────────────────┐
│  📋 Huiothesia Group                   👤 Leader Name  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Group Statistics:                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ 👥 45    │  │ ✅ 38    │  │ 📊 84%   │            │
│  │ Members  │  │ Present  │  │ This Wk  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                                                        │
│  ⚠️ Attention Needed:                                  │
│  • 3 members absent for 3+ weeks                       │
│  • 2 new members need follow-up                        │
│                                                        │
│  Quick Actions:                                        │
│  [📋 Record Attendance] [+ Add Member] [📊 Reports]    │
└────────────────────────────────────────────────────────┘
```

---

### 📋 Leader Task 1: Recording Attendance (Most Important!)

**When:** Every Saturday after fellowship  
**Time:** 5-10 minutes

#### Step-by-Step: Recording Attendance

1. **Navigate** to **Attendance** from the sidebar
2. **Click "Record Attendance"** or **"+ New Session"**
3. **Fill in session details:**

```
┌─ Record Attendance Session ────────────────────────────┐
│                                                        │
│  Event Type:  [Saturday Fellowship]                    │
│               (Group Leaders record Saturday only)     │
│                                                        │
│  Date:        [Jan 18, 2026] 📅                        │
│  Group:       [Huiothesia ▼]                           │
│  Cutoff Time: [09:00 AM]                               │
│                                                        │
│  Notes:       [________________________]               │
│               (Optional: e.g., "Great turnout!")       │
│                                                        │
│  [Cancel]                    [Next: Mark Attendance]   │
└────────────────────────────────────────────────────────┘
```

**Note:** 
- **Group Leaders** can only record **Saturday Fellowship** attendance
- **Leadership Meetings** are recorded by Branch Heads
- **CBS (Community Bible Study)** is recorded by CBS Leaders

4. **Click "Next: Mark Attendance"**
5. **Mark each member:**

```
┌─ Mark Attendance: Huiothesia - Jan 18, 2026 ───────────┐
│  [Search members...]                    [Select All]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ☑️ John Adekunle          [Present] [Late] [Absent]  │
│     Status: Established    Last: Jan 11 (Present)      │
│                                                        │
│  ☑️ Mary Okonkwo           [Present] [Late] [Absent]  │
│     Status: Semi-Consistent Last: Jan 11 (Present)     │
│                                                        │
│  ☐ David Okafor            [Present] [Late] [Absent]  │
│     Status: Preliminary    Last: Jan 11 (Absent)       │
│     ⚠️ Absent 2 weeks in a row                         │
│                                                        │
│  ☑️ Grace Nwosu            [Present] [Late] [Absent]  │
│     Status: Established    Last: Jan 11 (Late)         │
│                                                        │
│  [Show: All ▼] [Filter: Absent ▼]                     │
│                                                        │
│  Summary: 38 Present | 5 Late | 2 Absent               │
│                                                        │
│  [Back]                           [Save Attendance]    │
└────────────────────────────────────────────────────────┘
```

6. **Click on each member** to mark them as:
   - ✅ **Present** - They attended on time
   - ⏰ **Late** - They arrived after cutoff time
   - ❌ **Absent** - They didn't attend

7. **Review the summary** at the bottom
8. **Click "Save Attendance"**

#### Quick Tips for Recording Attendance

- ✅ **Do it immediately** after fellowship while it's fresh
- ✅ **Use the search bar** for large groups
- ✅ **Check the warnings** for members absent multiple weeks
- ✅ **Add notes** for special circumstances (e.g., "Sick", "Traveling")
- ✅ **Double-check** before saving - you can edit later if needed

---

### 📋 Leader Task 2: Adding a New Member

**When:** Someone new joins your group

#### Step-by-Step: Adding a Member

1. **Navigate** to **Members**
2. **Click "+ Add Member"**
3. **Fill in member details:**

```
┌─ Add New Member ───────────────────────────────────────┐
│                                                        │
│  Full Name:     [________________________]             │
│                                                        │
│  Phone Number:  [________________________]             │
│                 (Optional but recommended)             │
│                                                        │
│  Address:       [________________________]             │
│                 (Optional)                             │
│                                                        │
│  Gender:        [▼ Select]                             │
│                 ├─ Male                                │
│                 └─ Female                              │
│                                                        │
│  School Name:   [________________________]             │
│                 (If student)                           │
│                                                        │
│  Group:         [Huiothesia ▼]                         │
│                 (Auto-filled with your group)          │
│                                                        │
│  Status:        [● Preliminary]                        │
│                 (Auto-set for new members)             │
│                                                        │
│  [Cancel]                          [Add Member]        │
└────────────────────────────────────────────────────────┘
```

4. **Click "Add Member"**
5. **The member will appear** in your group list

#### Member Status Progression

```
NEW MEMBER
    ↓
┌─────────────────┐
│  PRELIMINARY    │ ← Just joined, getting to know the group
└─────────────────┘
    ↓ (After 3 attendances)
┌─────────────────┐
│ SEMI-CONSISTENT │ ← Attending regularly, building habit
└─────────────────┘
    ↓ (After consistent attendance)
┌─────────────────┐
│  ESTABLISHED    │ ← Committed member, consistent attender
└─────────────────┘
```

**Note:** The system automatically updates member status based on attendance!

---

### 📋 Leader Task 3: Viewing Member Details

**Purpose:** Track individual member progress and attendance history

#### How to View Member Details

1. **Navigate** to **Members**
2. **Click on any member's name**
3. **View their profile:**

```
┌─ Member Profile: John Adekunle ────────────────────────┐
│                                                        │
│  👤 Personal Information                               │
│  Name:          John Adekunle                          │
│  Phone:         +234 801 234 5678                      │
│  Address:       123 Main Street, Lagos                 │
│  Gender:        Male                                   │
│  School:        University of Lagos                    │
│  Status:        🟢 Established                         │
│  Joined:        Sep 15, 2025 (4 months ago)            │
│                                                        │
│  📊 Attendance Statistics                              │
│  Total Sessions:      18                               │
│  Present:            16 (89%)                          │
│  Late:                1 (6%)                           │
│  Absent:              1 (6%)                           │
│  Current Streak:      8 weeks                          │
│                                                        │
│  📅 Recent Attendance History                          │
│  ┌──────────────┬──────────┬────────────┐             │
│  │ Date         │ Status   │ Notes      │             │
│  ├──────────────┼──────────┼────────────┤             │
│  │ Jan 18, 2026 │ ✅ Present│           │             │
│  │ Jan 11, 2026 │ ✅ Present│           │             │
│  │ Jan 04, 2026 │ ✅ Present│           │             │
│  │ Dec 28, 2025 │ ⏰ Late   │ Traffic   │             │
│  │ Dec 21, 2025 │ ✅ Present│           │             │
│  └──────────────┴──────────┴────────────┘             │
│                                                        │
│  [Edit Member] [View Full History] [Send Message]      │
└────────────────────────────────────────────────────────┘
```

---

### 📋 Leader Task 4: Generating Group Reports

**Purpose:** Track your group's progress and identify trends

#### How to Generate a Report

1. **Navigate** to **Reports**
2. **Select report type:**
   - **Group Summary** - Overall group statistics
   - **Member Attendance** - Individual member breakdown
   - **Trend Analysis** - Attendance trends over time

3. **Choose date range:**

```
┌─ Generate Report ──────────────────────────────────────┐
│                                                        │
│  Report Type:   [▼ Group Summary]                      │
│                                                        │
│  Date Range:    [▼ Last 30 Days]                       │
│                 ├─ Last 7 Days                         │
│                 ├─ Last 30 Days                        │
│                 ├─ Last 3 Months                       │
│                 ├─ This Year                           │
│                 └─ Custom Range...                     │
│                                                        │
│  Group:         [Huiothesia ▼]                         │
│                                                        │
│  Format:        ☑️ PDF  ☑️ Excel  ☐ Email              │
│                                                        │
│  [Cancel]                      [Generate Report]       │
└────────────────────────────────────────────────────────┘
```

4. **Click "Generate Report"**
5. **Download or email** the report

#### Sample Group Report

```
┌─ Group Summary Report ─────────────────────────────────┐
│  Group: Huiothesia                                     │
│  Period: Dec 18, 2025 - Jan 18, 2026 (4 weeks)         │
│  Generated: Jan 18, 2026                               │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📊 Key Metrics                                        │
│  • Total Members: 45                                   │
│  • Average Attendance: 38 (84%)                        │
│  • New Members: 3                                      │
│  • Members at Risk: 2 (3+ absences)                    │
│                                                        │
│  📈 Attendance Trend                                   │
│  Week 1: 40 (89%) ████████████████████                 │
│  Week 2: 38 (84%) ██████████████████                   │
│  Week 3: 36 (80%) ████████████████                     │
│  Week 4: 38 (84%) ██████████████████                   │
│                                                        │
│  ⚠️ Members Needing Attention                          │
│  1. David Okafor - Absent 3 weeks                      │
│  2. Sarah Bello - Absent 3 weeks                       │
│                                                        │
│  🌟 Top Attenders (100% attendance)                    │
│  1. John Adekunle                                      │
│  2. Mary Okonkwo                                       │
│  3. Grace Nwosu                                        │
│                                                        │
│  💡 Recommendations                                    │
│  • Follow up with members absent 3+ weeks              │
│  • Celebrate consistent attenders                      │
│  • Continue current engagement strategies              │
└────────────────────────────────────────────────────────┘
```

---

## 🏛️ CBS Leader Portal Guide

**Who:** Senior Leaders assigned to manage Community Bible Study (CBS) locations

### What Can CBS Leaders Do?

```
┌─ CBS Leader Capabilities ──────────────────────────────┐
│                                                        │
│  ✅ Record CBS attendance                              │
│  ✅ Manage CBS location details                        │
│  ✅ View CBS attendance reports                        │
│  ✅ Track CBS member participation                     │
│  ✅ Generate CBS-specific reports                      │
│                                                        │
│  ❌ Cannot record Saturday Fellowship attendance       │
│  ❌ Cannot access Group or Branch data                 │
│  ❌ Cannot manage system settings                      │
└────────────────────────────────────────────────────────┘
```

### CBS Leader Dashboard

```
┌────────────────────────────────────────────────────────┐
│  🏛️ CBS Location: Kissy Community   👤 Leader Name    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  CBS Statistics:                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ 👥 28    │  │ ✅ 24    │  │ 📊 86%   │            │
│  │ Members  │  │ Present  │  │ This Wk  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                                                        │
│  📍 Location Details:                                  │
│  Address: 123 Kissy Road, Lagos                        │
│  District: W/A Urban                                   │
│  Branch: Eastern Branch                                │
│                                                        │
│  Quick Actions:                                        │
│  [📋 Record CBS Attendance] [📊 CBS Reports]           │
└────────────────────────────────────────────────────────┘
```

### 📋 CBS Task 1: Recording CBS Attendance

**When:** During each CBS session  

#### Step-by-Step: Recording CBS Attendance

1. **Navigate** to **CBS** from the sidebar
2. **Click "Record Attendance"**
3. **Fill in session details:**

```
┌─ Record CBS Attendance ────────────────────────────────┐
│                                                        │
│  Event Type:  [CBS - Community Bible Study]            │
│               (CBS Leaders record CBS only)            │
│                                                        │
│  Date:        [Jan 18, 2026] 📅                        │
│  CBS Location: [Ikeja Community ▼]                     │
│  Time:        [10:00 AM]                               │
│                                                        │
│  Notes:       [________________________]               │
│               (Optional: e.g., "Good discussion")      │
│                                                        │
│  [Cancel]                    [Next: Mark Attendance]   │
└────────────────────────────────────────────────────────┘
```

4. **Click "Next: Mark Attendance"**
5. **Mark each participant** as Present, Late, or Absent
6. **Click "Save Attendance"**

### 📋 CBS Task 2: Managing CBS Location

**Purpose:** Update CBS location details

1. **Navigate** to **CBS → Location Settings**
2. **Update** address, district, or other details
3. **Click "Save Changes"**

### 📋 CBS Task 3: Viewing CBS Reports

1. **Navigate** to **Reports**
2. **Select "CBS Report"**
3. **Choose date range**
4. **View or download** the report

---

## 🔧 Common Tasks

### Task: Changing Your Password

**Everyone should do this regularly!**

1. **Click your name** in the top right corner
2. **Select "Profile"**
3. **Click "Change Password"**
4. **Fill in the form:**

```
┌─ Change Password ──────────────────────────────────────┐
│                                                        │
│  Current Password:  [____________]                     │
│  New Password:      [____________]                     │
│  Confirm Password:  [____________]                     │
│                                                        │
│  Password Requirements:                                │
│  ✅ At least 8 characters                              │
│  ✅ Mix of letters and numbers                         │
│  ✅ Not the same as your email                         │
│                                                        │
│  [Cancel]                    [Update Password]         │
└────────────────────────────────────────────────────────┘
```

---

### Task: Bulk Importing Members

**For admins and leaders adding many members at once**

1. **Navigate** to **Members**
2. **Click "Import Members"**
3. **Download the template** (Excel file)
4. **Fill in member details** in the template
5. **Upload the file**
6. **Review and confirm** the import

```
Template Format:
┌──────────┬────────────┬────────┬─────────┬────────┐
│ Name     │ Phone      │ Gender │ School  │ Group  │
├──────────┼────────────┼────────┼─────────┼────────┤
│ John Doe │ 0801234567 │ Male   │ UNILAG  │ Huio.. │
│ Jane Doe │ 0809876543 │ Female │ UI      │ Doxa.. │
└──────────┴────────────┴────────┴─────────┴────────┘
```

---

### Task: Using QR Code for Attendance

**Quick attendance marking using QR codes**

#### For Leaders:

1. **Navigate** to **Attendance → QR Generator**
2. **Select your group and date**
3. **Display the QR code** on a screen/projector
4. **Members scan** with their phones
5. **System automatically marks** them present

```
┌─ QR Attendance ────────────────────────────────────────┐
│                                                        │
│  Group: Huiothesia                                     │
│  Date: Jan 18, 2026                                    │
│  Cutoff: 09:00 AM                                      │
│                                                        │
│         ┌─────────────────┐                            │
│         │  ███  ██  ████  │                            │
│         │  █  █ ██ █  ██  │                            │
│         │  ████ ██ █████  │  ← Members scan this       │
│         │  ██ █ ██  ████  │                            │
│         │  ████  ██  ███  │                            │
│         └─────────────────┘                            │
│                                                        │
│  ✅ Scanned: 32 members                                │
│  ⏰ Late: 3 members                                    │
│  ❌ Not scanned: 10 members                            │
│                                                        │
│  [End Session] [View Details]                          │
└────────────────────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### Problem: Can't Log In

**Solutions:**
1. ✅ Check your **email spelling** (no spaces, correct domain)
2. ✅ Check **Caps Lock** is off
3. ✅ Click **"Forgot Password"** to reset
4. ✅ Contact your **Admin** if still having issues

---

### Problem: Don't See My Group

**Solutions:**
1. ✅ Check you're assigned to a group (ask Admin)
2. ✅ Try **refreshing the page** (F5 or Ctrl+R)
3. ✅ **Log out and log back in**
4. ✅ Contact your **Branch Head**

---

### Problem: Can't Save Attendance

**Solutions:**
1. ✅ Check your **internet connection**
2. ✅ Make sure you've selected **all required fields**
3. ✅ Try **saving again** after a few seconds
4. ✅ If error persists, **take a screenshot** and contact Admin

---

### Problem: Member Not in List

**Solutions:**
1. ✅ Use the **search bar** to find them
2. ✅ Check if they're in the **correct group**
3. ✅ If new, **add them** using "+ Add Member"
4. ✅ Contact Admin if they should exist but don't appear

---

### Problem: Report Not Generating

**Solutions:**
1. ✅ Check your **date range** is valid
2. ✅ Ensure there's **data for that period**
3. ✅ Try a **different format** (PDF instead of Excel)
4. ✅ **Clear your browser cache** and try again

---

## 📞 Getting Help

### Quick Reference Card

**Print this and keep it handy!**

```
┌─ MorTendance Quick Reference ──────────────────────────┐
│                                                        │
│  🔐 Login URL: [your-mortendance-url.com]              │
│                                                        │
│  📋 Weekly Tasks (Leaders):                            │
│  1. Record attendance after Saturday fellowship        │
│  2. Follow up with absent members                      │
│  3. Review weekly reports                              │
│                                                        │
│  🆘 Need Help?                                         │
│  • Technical Issues: Contact Admin                     │
│  • Group Questions: Contact Branch Head                │
│  • System Training: Request from Coordinator           │
│                                                        │
│  ⚡ Quick Actions:                                     │
│  • Record Attendance: Attendance → New Session         │
│  • Add Member: Members → + Add Member                  │
│  • View Reports: Reports → Generate Report             │
│  • Change Password: Profile → Change Password          │
│                                                        │
│  💡 Tips:                                              │
│  • Save attendance immediately after fellowship        │
│  • Keep member phone numbers updated                   │
│  • Review reports weekly to spot trends                │
│  • Follow up with members absent 2+ weeks              │
└────────────────────────────────────────────────────────┘
```

---


## 📊 Understanding Reports

### Report Types Explained

#### 1. Group Summary Report
**Best for:** Weekly group overview  
**Shows:** Overall attendance, trends, members at risk  
**Use when:** You want a quick snapshot of your group

#### 2. Member Attendance Report
**Best for:** Individual tracking  
**Shows:** Each member's attendance history  
**Use when:** You need detailed member information

#### 3. Trend Analysis Report
**Best for:** Long-term planning  
**Shows:** Attendance patterns over months  
**Use when:** Planning events or identifying seasonal trends

#### 4. Branch Report (Branch Heads/Admins)
**Best for:** Multi-group overview  
**Shows:** All groups in a branch  
**Use when:** Comparing group performance

---

## 🎯 Best Practices

### For Leaders

✅ **DO:**
- Record attendance within 24 hours of fellowship
- Follow up with members absent 2+ weeks
- Review reports weekly
- Keep member information updated
- Celebrate consistent attenders
- Add notes for special circumstances

❌ **DON'T:**
- Wait until next week to record attendance
- Ignore members with declining attendance
- Share login credentials with others
- Delete members without admin approval
- Mark members present if they weren't there

---

### For Admins

✅ **DO:**
- Regularly review audit logs
- Back up data monthly
- Train new users properly
- Monitor system performance
- Update settings as needed
- Communicate changes to users

❌ **DON'T:**
- Give everyone admin access
- Delete data without backups
- Change settings without testing
- Ignore security warnings
- Skip user training

---

## 🔐 Security Tips

### Keeping Your Account Safe

1. **Use a strong password**
   - At least 8 characters
   - Mix of letters, numbers, and symbols
   - Don't use your name or birthday

2. **Never share your password**
   - Not even with other leaders
   - Each person should have their own account

3. **Log out when done**
   - Especially on shared computers
   - Click "Logout" in the menu

4. **Report suspicious activity**
   - Unexpected emails
   - Login attempts you didn't make
   - Changes you didn't authorize

---

## 📱 Mobile Access

### Using MorTendance on Your Phone

The system works on mobile browsers!

```
┌─────────────────────┐
│  📱 Mobile View     │
├─────────────────────┤
│  ☰ Menu             │
│                     │
│  📊 Dashboard       │
│  ┌───────────────┐  │
│  │ 👥 45 Members │  │
│  │ ✅ 38 Present │  │
│  └───────────────┘  │
│                     │
│  Quick Actions:     │
│  [📋 Attendance]    │
│  [+ Add Member]     │
│  [📊 Reports]       │
│                     │
└─────────────────────┘
```

**Tips for Mobile:**
- Use landscape mode for better viewing
- Tap and hold for more options
- Swipe to navigate between sections
- Use the search function for quick access

---

## 📝 Glossary

**Common Terms Explained:**

| Term | Meaning |
|------|---------|
| **Attendance Session** | A single fellowship meeting where attendance is recorded |
| **Branch** | A physical location or region of the ministry |
| **CBS** | Children's Bible Study - special program for kids |
| **Cutoff Time** | Time after which members are marked "Late" |
| **Established** | Member status for consistent, committed attenders |
| **Group** | A ministry group (e.g., Huiothesia, Doxasmus) |
| **Leader** | Person responsible for a group |
| **Member** | Individual attending fellowship |
| **Preliminary** | Status for new members |
| **Semi-Consistent** | Status for members building attendance habit |
| **Session** | Same as Attendance Session |

---


**You've got this! Welcome to MorTendance!** 🎉

---

*This guide is designed to be printed or viewed digitally. For best results, keep it bookmarked for quick reference.*
