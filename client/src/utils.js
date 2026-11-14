// Small helpers shared by several components.

// Name to show for a conversation: the group name, or the other person's name.
export function conversationTitle(conversation, me) {
  if (conversation.isGroup) return conversation.name;
  const other = conversation.members.find((m) => m.id !== me.id);
  return other ? other.displayName : "Just you";
}

// The other person in a direct message (null for group chats).
export function otherMember(conversation, me) {
  if (conversation.isGroup) return null;
  return conversation.members.find((m) => m.id !== me.id) || null;
}

// "14:05" for today, "Mar 3" for older messages.
export function formatTime(dateString) {
  const date = new Date(dateString);
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}
