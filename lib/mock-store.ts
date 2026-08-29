export interface MockBranch {
  id: string;
  name: string;
}

export interface MockGroup {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  leaderName: string;
  membersCount: number;
}

export interface MockMember {
  id: string;
  name: string;
  phoneNumber: string;
  status: "ESTABLISHED" | "SEMI_CONSISTENT" | "PRELIMINARY";
  branch: { id: string; name: string };
  group: { id: string; name: string };
  attendanceCount: number;
  roomId?: string | null;
  roomName?: string | null;
}

export interface MockLeader {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId?: string;
  groupId?: string;
}

export interface MockRoom {
  id: string;
  name: string;
  gender: "Male" | "Female" | "Mixed";
  capacity: number;
  location: string;
}

const DEFAULT_BRANCHES: MockBranch[] = [
  { id: "branch-1", name: "Headquarters" },
  { id: "branch-2", name: "Eastern" },
  { id: "branch-3", name: "Bo" }
];

const DEFAULT_GROUPS: MockGroup[] = [
  { id: "group-1", name: "Huiothesia", branchId: "branch-1", branchName: "Headquarters", leaderName: "Brother Sahr", membersCount: 4 },
  { id: "group-2", name: "Doxasmus", branchId: "branch-2", branchName: "Eastern", leaderName: "Sister Dauda", membersCount: 3 },
  { id: "group-3", name: "Paligenasia", branchId: "branch-3", branchName: "Bo", leaderName: "Sister Baindu", membersCount: 3 }
];

const DEFAULT_MEMBERS: MockMember[] = [
  { id: "m-1", name: "Sahr Dauda", phoneNumber: "+232 76 111111", status: "ESTABLISHED", branch: { id: "branch-1", name: "Headquarters" }, group: { id: "group-1", name: "Huiothesia" }, attendanceCount: 3, roomId: "room-1", roomName: "Dormitory A" },
  { id: "m-2", name: "Marcos Conteh", phoneNumber: "+232 76 222222", status: "ESTABLISHED", branch: { id: "branch-1", name: "Headquarters" }, group: { id: "group-1", name: "Huiothesia" }, attendanceCount: 3, roomId: "room-1", roomName: "Dormitory A" },
  { id: "m-3", name: "Baindu Koroma", phoneNumber: "+232 76 333333", status: "SEMI_CONSISTENT", branch: { id: "branch-1", name: "Headquarters" }, group: { id: "group-1", name: "Huiothesia" }, attendanceCount: 2, roomId: "room-2", roomName: "Dormitory B" },
  { id: "m-4", name: "Samuel Kamara", phoneNumber: "+232 76 444444", status: "PRELIMINARY", branch: { id: "branch-1", name: "Headquarters" }, group: { id: "group-1", name: "Huiothesia" }, attendanceCount: 1, roomId: null, roomName: null },
  { id: "m-5", name: "Fatmata Sesay", phoneNumber: "+232 76 555555", status: "ESTABLISHED", branch: { id: "branch-2", name: "Eastern" }, group: { id: "group-2", name: "Doxasmus" }, attendanceCount: 3, roomId: "room-2", roomName: "Dormitory B" },
  { id: "m-6", name: "Abu Turay", phoneNumber: "+232 76 666666", status: "SEMI_CONSISTENT", branch: { id: "branch-2", name: "Eastern" }, group: { id: "group-2", name: "Doxasmus" }, attendanceCount: 2, roomId: null, roomName: null },
  { id: "m-7", name: "Alusine Kargbo", phoneNumber: "+232 76 777777", status: "PRELIMINARY", branch: { id: "branch-2", name: "Eastern" }, group: { id: "group-2", name: "Doxasmus" }, attendanceCount: 1, roomId: null, roomName: null },
  { id: "m-8", name: "Kadiatu Bangura", phoneNumber: "+232 76 888888", status: "ESTABLISHED", branch: { id: "branch-3", name: "Bo" }, group: { id: "group-3", name: "Paligenasia" }, attendanceCount: 3, roomId: null, roomName: null },
  { id: "m-9", name: "Mohamed Mansaray", phoneNumber: "+232 76 999999", status: "SEMI_CONSISTENT", branch: { id: "branch-3", name: "Bo" }, group: { id: "group-3", name: "Paligenasia" }, attendanceCount: 2, roomId: null, roomName: null },
  { id: "m-10", name: "Mariama Dumbuya", phoneNumber: "+232 76 000000", status: "PRELIMINARY", branch: { id: "branch-3", name: "Bo" }, group: { id: "group-3", name: "Paligenasia" }, attendanceCount: 0, roomId: null, roomName: null }
];

const DEFAULT_LEADERS: MockLeader[] = [
  { id: "leader-1", name: "Brother Sahr", email: "sahr@mor.org", role: "PROBATION_LEADER" },
  { id: "leader-2", name: "Sister Dauda", email: "dauda@mor.org", role: "JUNIOR_LEADER" },
  { id: "leader-3", name: "Sister Baindu", email: "baindu@mor.org", role: "SENIOR_LEADER" }
];

const DEFAULT_ROOMS: MockRoom[] = [
  { id: "room-1", name: "Dormitory A", gender: "Male", capacity: 10, location: "Main Block, Ground Floor" },
  { id: "room-2", name: "Dormitory B", gender: "Female", capacity: 8, location: "Annex Block, 1st Floor" }
];

export function getMockBranches(): MockBranch[] {
  if (typeof window === "undefined") return DEFAULT_BRANCHES;
  const stored = localStorage.getItem("mor_camp_branches");
  if (!stored) {
    localStorage.setItem("mor_camp_branches", JSON.stringify(DEFAULT_BRANCHES));
    return DEFAULT_BRANCHES;
  }
  return JSON.parse(stored);
}

export function getMockGroups(): MockGroup[] {
  if (typeof window === "undefined") return DEFAULT_GROUPS;
  const stored = localStorage.getItem("mor_camp_groups");
  if (!stored) {
    localStorage.setItem("mor_camp_groups", JSON.stringify(DEFAULT_GROUPS));
    return DEFAULT_GROUPS;
  }
  return JSON.parse(stored);
}

export function getMockMembers(): MockMember[] {
  if (typeof window === "undefined") return DEFAULT_MEMBERS;
  const stored = localStorage.getItem("mor_camp_members");
  if (!stored) {
    localStorage.setItem("mor_camp_members", JSON.stringify(DEFAULT_MEMBERS));
    return DEFAULT_MEMBERS;
  }
  return JSON.parse(stored);
}

export function getMockLeaders(): MockLeader[] {
  if (typeof window === "undefined") return DEFAULT_LEADERS;
  const stored = localStorage.getItem("mor_camp_leaders");
  if (!stored) {
    localStorage.setItem("mor_camp_leaders", JSON.stringify(DEFAULT_LEADERS));
    return DEFAULT_LEADERS;
  }
  return JSON.parse(stored);
}

export function getMockRooms(): MockRoom[] {
  if (typeof window === "undefined") return DEFAULT_ROOMS;
  const stored = localStorage.getItem("mor_camp_rooms");
  if (!stored) {
    localStorage.setItem("mor_camp_rooms", JSON.stringify(DEFAULT_ROOMS));
    return DEFAULT_ROOMS;
  }
  return JSON.parse(stored);
}

export function addMockMember(member: { name: string; phoneNumber: string; groupId: string; branchId: string; roomId?: string | null }) {
  const members = getMockMembers();
  const groups = getMockGroups();
  const branches = getMockBranches();
  const rooms = getMockRooms();

  const group = groups.find(g => g.id === member.groupId);
  const branch = branches.find(b => b.id === member.branchId);
  const room = member.roomId ? rooms.find(r => r.id === member.roomId) : null;

  const newMember: MockMember = {
    id: `m-${Date.now()}`,
    name: member.name,
    phoneNumber: member.phoneNumber,
    status: "PRELIMINARY",
    branch: { id: member.branchId, name: branch?.name || "HQ" },
    group: { id: member.groupId, name: group?.name || "General" },
    attendanceCount: 0,
    roomId: member.roomId || null,
    roomName: room?.name || null
  };

  const updated = [...members, newMember];
  localStorage.setItem("mor_camp_members", JSON.stringify(updated));

  // Update group count
  if (group) {
    const updatedGroups = groups.map(g => g.id === group.id ? { ...g, membersCount: g.membersCount + 1 } : g);
    localStorage.setItem("mor_camp_groups", JSON.stringify(updatedGroups));
  }

  return newMember;
}

export function updateMockMemberRoom(memberId: string, roomId: string | null) {
  const members = getMockMembers();
  const rooms = getMockRooms();
  const room = roomId ? rooms.find(r => r.id === roomId) : null;

  const updated = members.map(m => {
    if (m.id === memberId) {
      return {
        ...m,
        roomId: roomId || null,
        roomName: room ? room.name : null
      };
    }
    return m;
  });

  localStorage.setItem("mor_camp_members", JSON.stringify(updated));
}

export function deleteMockMember(memberId: string) {
  const members = getMockMembers();
  const groups = getMockGroups();
  const member = members.find(m => m.id === memberId);

  if (member) {
    const updated = members.filter(m => m.id !== memberId);
    localStorage.setItem("mor_camp_members", JSON.stringify(updated));

    // Update group count
    const updatedGroups = groups.map(g => g.id === member.group.id ? { ...g, membersCount: Math.max(0, g.membersCount - 1) } : g);
    localStorage.setItem("mor_camp_groups", JSON.stringify(updatedGroups));
  }
}

export function addMockBranch(branch: { name: string; headId?: string }) {
  const branches = getMockBranches();
  const newBranch: MockBranch = {
    id: `branch-${Date.now()}`,
    name: branch.name
  };
  const updated = [...branches, newBranch];
  localStorage.setItem("mor_camp_branches", JSON.stringify(updated));
  return newBranch;
}

export function addMockGroup(group: { name: string; branchId?: string; leaderId?: string }) {
  const groups = getMockGroups();
  const branches = getMockBranches();
  const leaders = getMockLeaders();

  const branch = branches.find(b => b.id === group.branchId);
  const leader = leaders.find(l => l.id === group.leaderId);

  const newGroup: MockGroup = {
    id: `group-${Date.now()}`,
    name: group.name,
    branchId: group.branchId || "branch-1",
    branchName: branch?.name || "Headquarters",
    leaderName: leader?.name || "None",
    membersCount: 0
  };
  const updated = [...groups, newGroup];
  localStorage.setItem("mor_camp_groups", JSON.stringify(updated));
  return newGroup;
}

export function addMockLeader(leader: { name: string; email: string; role: string; branchId?: string; groupId?: string }) {
  const leaders = getMockLeaders();
  const newLeader: MockLeader = {
    id: `leader-${Date.now()}`,
    name: leader.name,
    email: leader.email,
    role: leader.role,
    branchId: leader.branchId,
    groupId: leader.groupId
  };
  const updated = [...leaders, newLeader];
  localStorage.setItem("mor_camp_leaders", JSON.stringify(updated));
  return newLeader;
}

export function updateMockGroup(data: { id: string; name: string; branchId: string; leaderId?: string | null }) {
  const groups = getMockGroups();
  const branches = getMockBranches();
  const leaders = getMockLeaders();

  const branch = branches.find(b => b.id === data.branchId);
  const leader = leaders.find(l => l.id === data.leaderId);

  const updatedGroups = groups.map(g => {
    if (g.id === data.id) {
      return {
        ...g,
        name: data.name,
        branchId: data.branchId,
        branchName: branch?.name || g.branchName,
        leaderName: leader?.name || g.leaderName
      };
    }
    return g;
  });

  localStorage.setItem("mor_camp_groups", JSON.stringify(updatedGroups));
  return { success: true };
}

export function addMockRoom(room: { name: string; gender: "Male" | "Female" | "Mixed"; capacity: number; location: string }) {
  const rooms = getMockRooms();
  const newRoom: MockRoom = {
    id: `room-${Date.now()}`,
    name: room.name,
    gender: room.gender,
    capacity: room.capacity,
    location: room.location
  };
  const updated = [...rooms, newRoom];
  localStorage.setItem("mor_camp_rooms", JSON.stringify(updated));
  return newRoom;
}

export function deleteMockRoom(roomId: string) {
  const rooms = getMockRooms();
  const updated = rooms.filter(r => r.id !== roomId);
  localStorage.setItem("mor_camp_rooms", JSON.stringify(updated));

  // Remove room assignment from members in this room
  const members = getMockMembers();
  const updatedMembers = members.map(m => m.roomId === roomId ? { ...m, roomId: null, roomName: null } : m);
  localStorage.setItem("mor_camp_members", JSON.stringify(updatedMembers));
}
