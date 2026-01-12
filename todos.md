### Overall 
    - This dashboard is accompanied by a landing page. The landing page is what everyone sees before getting to the admin and leader login
    - The aim is for the ministry to be able to do everything, and collect every detail and report throgh this system.
    - It goes not only in attendance in Saturday fellowship, but also to Evangelism, to leadership meetings(On Sundays and Thursdays), to 
      Stewards tracking, to Community Bible Studies report, to School reports tracking even to daily Bible reading tracking.
    - The dashboard is divided into Leader and Admin(Min Marcos). Admin sees all, leader sees his own info.
    - Every report generated can be downloaded through pdf, excel, and csv.
    - Evaluations should be by week, month, quarter, and year
    - The ministry has three branches(Headquarters, Eastern and Bo). All collect attendance(on Saturdays, and for evangelism).
    - CBS attendance is by location. Admin opens a new location, and adds a leader. Then members can be able to mark attendance for that CBS location  (Address, District, Leader, Branch)
    - Every branch in the ministry has heads. ("HQ":"Admin", "Eastern":"Another", "Bo":"Another"). 
    - Admin adds heads of other branches, and they too can oversea their branch, and every activity undergone there (Attendance, Stewards, Evangelism, New comers)
    - So there's Admin, Branch Head, and Leader(All these should have portals/dashboard)
    
### Attendance Tracking
    -There are different categories which we track attendance for.
  ### Fellowship Attendance
   ### Every Saturday fellowship attendance should be recorded through the system.
      ~ Members scan a QR code and mark their attendance 
      ~ Leaders mark for ones without mobile devices
      ~ New comers are added fresh, their full detail (Name, Phone Number, Address, Gender)
      ~ This attendance should be tracked by the admin for overall performance (Per branch, per group, and the ministry as a whole)
      ~ Various leaders should be able to track their group's performance, and individual members who did not attend fellowship that week, or have been missing from fellowship for a very long time.
   ### Sunday and Thursdays
      ~ Attendance for leadership meetings on Sundays and Thursdays should be recorded through the system.
      ~ Every leader marks present for the day
      ~ Admin tracks record of every leader, with reports of effective and non effective ones in place.
      ~ Every leader sees his own performance
  ### Stewards Attendance
      ~ Every steward will mark attendance, and will be tracked by the branch head, and also Admin.
  ### CBS Attendance
      ~ Members scan a QR code and mark their attendance 
      ~ Leaders mark for ones without mobile devices
      ~ New comers(that are neither in fellowship nor CBS) are added fresh, their full detail (Name, Phone Number, Address, Gender)
      ~ Report of CBS members, active ones, plus the CBS as a whole(to Admin, and CBS leader).
  ### Evangelism Attendance
      ~ Every member/leader marks attendance for Evangelism every Friday(After the evangelism).
  ### School Attendance
      ~ It should be recorded every time a group visits a school. Individuals should mark attendance.
      ~ Attendance of how many school students attended fellowship should be traced also, so when someone marks attendance, he should tell if he was invited in his/her school, and the name of the school.
      
### Architectural Roadmap (Senior Engineer Plan)

#### Sprint A: The Foundation (Database & Architecture)
- [x] **Schema Refactor:**
    - [x] Introduce `Branch` entity (HQ, Eastern, Bo).
    - [x] Update `User` roles to include `BRANCH_HEAD`.
    - [x] Upgrade `Member` profile to CRM-style (Gender, Address, Phone, Branch Link).
    - [x] Implement `AttendanceSession` & `AttendanceRecord` for multi-event tracking (Fellowship, CBS, Evangelism).
- [x] **Data Migration:** Ensure existing data maps to the new structure.

#### Sprint B: The Input Engine (QR & Onboarding)
- [x] **Newcomer Flow:** Create a dedicated form for adding new members with full details.
- [x] **QR Check-in System:**
    - [x] Generate static QR codes for Branches/Events.
    - [x] Build the "Self-Check-in" page for members.
    - [ ] Build the "Manual Check-in" list for Leaders.

#### Sprint C: The Dashboards (Intelligence)
- [ ] **Branch Head Portal:** A view scoped to a specific branch's performance.
- [x] **Master Admin Reports:** The "God View" for Min Marcos (All branches, all metrics).
- [x] **Export Engine:** One-click PDF/CSV generation for any data view.
- [x] **Group Management:** Integrated group management within the members portal.