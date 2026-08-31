import { Routes, Route, Navigate } from "react-router-dom";
import MobileMainTabs from "./Mobile/MobileMainTabs";
import MobilePageShell from "./Mobile/MobilePageShell";
import Register from "./Auth/Register";
import Login from "./Auth/Login";
import PublicProfile from "./Desktop/Profile/PublicProfile";
import MyFriends from "./Desktop/Profile/MyFriends";
import ForgotPassword from "./Auth/ForgotPassword/ForgotPassword";
import HistoryPanel from "./Profile/HistoryPanel";
import AuthModal from "./Desktop/Modal/AuthModal";
import AddFriendsModal from "./Desktop/Modal/AddFriendsModal";
import ShareEventModal from "./Desktop/Modal/ShareEventModal";

export default function MobileContent() {
	return (
		<>
			<Routes>
				<Route path="/" element={<MobileMainTabs />} />
				<Route path="/search" element={<Navigate to="/?tab=search" replace />} />
				<Route path="/friends" element={<Navigate to="/?tab=friends" replace />} />
				<Route path="/favorites" element={<Navigate to="/?tab=favorites" replace />} />
				<Route path="/profile" element={<Navigate to="/?tab=profile" replace />} />
				<Route path="/profile/history" element={<MobilePageShell activeTab="profile"><HistoryPanel /></MobilePageShell>} />
				<Route path="/register" element={<Register />} />
				<Route path="/login" element={<Login />} />
				<Route path="/forgot-password" element={<ForgotPassword />} />
				<Route
					path="/:id/profile"
					element={
						<MobilePageShell activeTab="profile">
							<PublicProfile />
						</MobilePageShell>
					}
				/>
				<Route
					path="/profile/my-friends"
					element={
						<MobilePageShell activeTab="friends">
							<MyFriends />
						</MobilePageShell>
					}
				/>
			</Routes>
			<AuthModal />
			<AddFriendsModal />
			<ShareEventModal />
		</>
	);
}
