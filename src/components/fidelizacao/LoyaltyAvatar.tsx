"use client";

import type { LoyaltyMemberProfile } from "@/lib/loyalty";

const LEVEL_CLASS: Record<string, string> = {
  bronze: "loyalty-level-bronze",
  prata: "loyalty-level-prata",
  ouro: "loyalty-level-ouro",
};

export function LoyaltyAvatar({
  member,
  size = "md",
  onClick,
}: {
  member: Pick<LoyaltyMemberProfile, "name" | "avatarUrl" | "level">;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}) {
  const initial = member.name.trim().charAt(0).toUpperCase() || "?";
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`loyalty-avatar loyalty-avatar-${size} ${onClick ? "is-clickable" : ""}`}
    >
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.avatarUrl} alt="" className="loyalty-avatar-img" />
      ) : (
        <span className="loyalty-avatar-fallback">{initial}</span>
      )}
      <span
        className={`loyalty-avatar-level ${LEVEL_CLASS[member.level.id] ?? ""}`}
      >
        {member.level.label}
      </span>
    </Tag>
  );
}
