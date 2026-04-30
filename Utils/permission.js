function isStaff(member) {
  return member.permissions.has("ModerateMembers");
}

module.exports = { isStaff };