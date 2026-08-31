export type MainMobileTab = "home" | "search" | "friends" | "favorites" | "profile";

export function parseMainTab(searchParams: URLSearchParams): MainMobileTab {
    const raw = searchParams.get("tab");
    if (raw === "search" || raw === "friends" || raw === "favorites" || raw === "profile") return raw;
    return "home";
}
