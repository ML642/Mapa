import React, { useRef, useState, useLayoutEffect, useEffect } from "react";
import { motion, useMotionValue, useDragControls, animate, type PanInfo } from "framer-motion";
import MapBoxMap from "./Map/MapBoxMap";
import PullToRefreshScrollView from "./PullToRefreshScrollView";
import MobileFiltersBar from "./Filters/MobileFiltersBar";
import type { MobileFilterDetails } from "./mobileDateRange";

const SHEET_PEEK_PX = 76;
const SHEET_EXTRA_UP_PX = 32;
const SHEET_BOTTOM_NUDGE_PX = 22;
const SHEET_BOTTOM_PADDING_PX = 11;
const SHEET_SCROLL_BOTTOM_PADDING = `calc(${SHEET_BOTTOM_PADDING_PX + 16}px + env(safe-area-inset-bottom, 0px))`;
const SHEET_SNAP_VELOCITY_PX = 520;
const SHEET_SNAP_HYSTERESIS_PX = 28;
const SHEET_SNAP_PROJECTION_MS = 0.18;
const SHEET_SPRING = { type: "tween" as const, duration: 0.36, ease: [0.22, 1, 0.36, 1] as const };

const sheetHeightBase = "min(58dvh, calc(100dvh - 7rem - env(safe-area-inset-bottom, 0px)))";
const sheetHeightFull = `min(calc(70dvh + ${SHEET_EXTRA_UP_PX}px), calc(100dvh - 7rem - env(safe-area-inset-bottom, 0px) + ${SHEET_EXTRA_UP_PX}px))`;
type SheetSnap = "full" | "peek";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getSheetSnapOffset = (snap: SheetSnap, dragMax: number) => (snap === "peek" ? dragMax : 0);

const resolveSheetSnap = (
	current: number,
	velocity: number,
	dragMax: number,
	activeSnap: SheetSnap,
): SheetSnap => {
	if (Math.abs(velocity) >= SHEET_SNAP_VELOCITY_PX) {
		return velocity > 0 ? "peek" : "full";
	}

	const projected = clamp(current + velocity * SHEET_SNAP_PROJECTION_MS, 0, dragMax);
	const distanceToFull = Math.abs(projected);
	const distanceToPeek = Math.abs(dragMax - projected);

	if (Math.abs(distanceToFull - distanceToPeek) <= SHEET_SNAP_HYSTERESIS_PX) {
		return activeSnap;
	}

	return distanceToFull <= distanceToPeek ? "full" : "peek";
};

type MobileHomeLayoutProps = {
	children: React.ReactNode;
	selectedCategories: string[];
	setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
	onEventMapClick: (id: string) => void;
	activeEventId: string | null;
	filtersVisible: boolean;
	onOpenFullSearch: () => void;
	onOpenFullFilters: () => void;
	selectedFiltersCount: number;
	mobileFilterDetails: MobileFilterDetails;
	setMobileFilterDetails: React.Dispatch<React.SetStateAction<MobileFilterDetails>>;
	friendsGoingEventIds: Set<string>;
	friendsInterestedEventIds: Set<string>;
	searchText?: string;
};

export default function MobileHomeLayout({
	children,
	selectedCategories,
	setSelectedCategories,
	onEventMapClick,
	activeEventId,
	filtersVisible,
	onOpenFullSearch,
	onOpenFullFilters,
	selectedFiltersCount,
	mobileFilterDetails,
	setMobileFilterDetails,
	friendsGoingEventIds,
	friendsInterestedEventIds,
	searchText,
}: MobileHomeLayoutProps) {
	const isFirefoxAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent) && /firefox/i.test(navigator.userAgent);
	const mobileNavHeight = isFirefoxAndroid ? "4.5rem" : "5rem";
	const headerRef = useRef<HTMLDivElement>(null);
	const sheetRef = useRef<HTMLDivElement>(null);
	const dragControls = useDragControls();
	const sheetY = useMotionValue(0);
	const sheetAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
	const lastSheetDragAtRef = useRef(0);
	const collapsedSheetPointerStartYRef = useRef<number | null>(null);
	const collapsedSheetShouldOpenRef = useRef(false);
	const sheetPullClosingRef = useRef(false);
	const sheetOpenShieldTimeoutRef = useRef<number | null>(null);

	const [sheetSnap, setSheetSnap] = useState<SheetSnap>("peek");
	const [sheetDragMax, setSheetDragMax] = useState(0);
	const [headerBottom, setHeaderBottom] = useState(0);
	const [isSheetOpening, setIsSheetOpening] = useState(false);
	const isSheetCollapsed = sheetSnap === "peek";
	const sheetFullHeight = headerBottom > 0
		? `calc(100dvh - ${headerBottom}px - ${mobileNavHeight} - env(safe-area-inset-bottom, 0px) + ${SHEET_BOTTOM_NUDGE_PX}px)`
		: sheetHeightFull;

	const animateSheetToSnap = (nextSnap: SheetSnap, dragMax = sheetDragMax) => {
		if (dragMax <= 0) return;
		sheetAnimationRef.current?.stop();
		sheetAnimationRef.current = animate(sheetY, getSheetSnapOffset(nextSnap, dragMax), SHEET_SPRING);
	};

	const commitSheetSnap = (nextSnap: SheetSnap) => {
		if (nextSnap === "full" && sheetSnap === "peek") {
			setIsSheetOpening(true);
			if (sheetOpenShieldTimeoutRef.current !== null) window.clearTimeout(sheetOpenShieldTimeoutRef.current);
			sheetOpenShieldTimeoutRef.current = window.setTimeout(() => {
				setIsSheetOpening(false);
				sheetOpenShieldTimeoutRef.current = null;
			}, 450);
		}
		if (nextSnap === "full") sheetPullClosingRef.current = false;
		setSheetSnap(nextSnap);
		animateSheetToSnap(nextSnap);
	};

	const handleSheetPullProgress = (offset: number) => {
		if (sheetSnap !== "full" || sheetPullClosingRef.current) return;
		sheetAnimationRef.current?.stop();
		sheetY.set(Math.min(offset, sheetDragMax));
	};

	const handleSheetPullComplete = () => {
		if (sheetSnap !== "full") return;
		sheetPullClosingRef.current = true;
		commitSheetSnap("peek");
	};

	const handleSheetDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
		if (sheetDragMax <= 0) return;
		const movedUp = info.offset.y < -12 || info.velocity.y < -180;
		const movedDown = info.offset.y > 12 || info.velocity.y > 180;
		const nextSnap = sheetSnap === "peek" && movedUp
			? "full"
			: sheetSnap === "full" && movedDown
				? "peek"
				: resolveSheetSnap(sheetY.get(), info.velocity.y, sheetDragMax, sheetSnap);
		commitSheetSnap(nextSnap);
		lastSheetDragAtRef.current = Date.now();
	};

	const toggleSheet = () => {
		if (Date.now() - lastSheetDragAtRef.current < 400) {
			return;
		}

		commitSheetSnap(sheetSnap === "peek" ? "full" : "peek");
	};

	const openCollapsedSheet = () => {
		collapsedSheetPointerStartYRef.current = null;
		collapsedSheetShouldOpenRef.current = false;
		commitSheetSnap("full");
	};

	const handleCollapsedSheetPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		collapsedSheetPointerStartYRef.current = event.clientY;
		collapsedSheetShouldOpenRef.current = false;
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const handleCollapsedSheetPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		const startY = collapsedSheetPointerStartYRef.current;
		if (startY !== null && startY - event.clientY >= 8) collapsedSheetShouldOpenRef.current = true;
	};

	const handleCollapsedSheetPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		const shouldOpen = collapsedSheetShouldOpenRef.current;
		collapsedSheetPointerStartYRef.current = null;
		collapsedSheetShouldOpenRef.current = false;

		if (shouldOpen) {
			event.preventDefault();
			// Let pointerup finish while the overlay is still mounted. This prevents
			// iOS from retargeting the release to an event card underneath.
			window.setTimeout(openCollapsedSheet, 0);
		}
	};

	useLayoutEffect(() => {
		const el = sheetRef.current;
		if (!el) return;
		const measure = () => {
			const h = el.getBoundingClientRect().height;
			setSheetDragMax(Math.max(0, h - SHEET_PEEK_PX));
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	useEffect(() => () => {
		if (sheetOpenShieldTimeoutRef.current !== null) window.clearTimeout(sheetOpenShieldTimeoutRef.current);
	}, []);

	useLayoutEffect(() => {
		const header = headerRef.current;
		if (!header) return;

		const measure = () => {
			setHeaderBottom(Math.ceil(header.getBoundingClientRect().bottom));
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(header);
		window.addEventListener("resize", measure);

		return () => {
			observer.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, []);

	useEffect(() => {
		if (sheetDragMax > 0) {
			sheetAnimationRef.current?.stop();
			sheetAnimationRef.current = animate(sheetY, getSheetSnapOffset(sheetSnap, sheetDragMax), SHEET_SPRING);
		}
		return () => {
			sheetAnimationRef.current?.stop();
		};
	}, [sheetDragMax, sheetSnap, sheetY]);

	return (
		<div className="relative h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-surface-map">
			<div className="absolute inset-0 z-0">
				<MapBoxMap
					onEventClick={onEventMapClick}
					selectedCategories={selectedCategories}
					activeEventId={activeEventId}
					mobileFilterDetails={mobileFilterDetails}
					friendsGoingEventIds={friendsGoingEventIds}
					friendsInterestedEventIds={friendsInterestedEventIds}
					onMapClick={() => {
						if (sheetSnap === "full") commitSheetSnap("peek");
					}}
				/>
			</div>


			<div
				ref={headerRef}
				className="absolute left-0 right-0 top-0 z-20 flex flex-col gap-2"
				style={{ paddingTop: "max(10px, env(safe-area-inset-top, 0px))" }}
			>
				<div className="pointer-events-none flex w-full min-w-0 flex-col gap-2 px-[clamp(10px,3vw,16px)]">
					<div className="pointer-events-auto flex w-full min-w-0 items-center gap-[clamp(8px,2vw,12px)]">
						<button
							type="button"
							onClick={onOpenFullSearch}
							className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 rounded-[28px] bg-surface-page px-[clamp(12px,4vw,16px)] text-left shadow-[var(--shadow-app-sm)] outline-none active:scale-[0.99]"
							style={{ paddingBlock: "clamp(10px, 2.5vw, 14px)" }}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 33 33"
								fill="none"
								className="shrink-0 text-brand"
								aria-hidden
							>
								<g clipPath="url(#clip0_mobile_search_field)">
									<path
										d="M4.90151 3.18538C4.73918 3.3302 4.58044 3.47806 4.42275 3.62794C4.26605 3.7777 4.26605 3.7777 4.09853 3.90749C3.87313 4.08893 3.70011 4.30641 3.51333 4.52638C3.46233 4.58366 3.41133 4.64095 3.35879 4.69997C1.52134 6.78155 0.266243 9.66644 0.250633 12.4646C0.250191 12.5172 0.249752 12.5699 0.249298 12.6241C0.235001 14.8308 0.234997 14.8308 0.450829 15.7764C0.463911 15.8344 0.476992 15.8925 0.490471 15.9523C1.18667 18.9583 2.84882 21.7163 5.34264 23.5707C5.44669 23.6483 5.54948 23.7274 5.65224 23.8067C8.26502 25.7859 11.7834 26.5573 15.0094 26.1436C16.6535 25.9078 18.1609 25.3648 19.6268 24.5971C19.7964 24.5092 19.9674 24.4242 20.1383 24.3389C20.1754 24.3762 20.2126 24.4136 20.2508 24.452C21.1552 25.362 22.0603 26.2713 22.9662 27.1797C23.4043 27.6191 23.8422 28.0587 24.2794 28.4989C24.6607 28.8826 25.0425 29.266 25.4247 29.6488C25.627 29.8514 25.829 30.0542 26.0305 30.2575C26.2205 30.4492 26.4111 30.6403 26.6021 30.8309C26.6718 30.9007 26.7413 30.9707 26.8105 31.0409C27.564 31.8043 28.2384 32.227 29.3219 32.2412C29.8024 32.238 30.2088 32.1958 30.6383 31.9639C30.6965 31.9328 30.7547 31.9017 30.8146 31.8696C31.5425 31.4432 31.9985 30.8473 32.2356 30.032C32.3936 29.2891 32.3164 28.4105 31.9277 27.7575C31.62 27.3068 31.2527 26.9279 30.8664 26.5456C30.7955 26.4748 30.7246 26.4039 30.6537 26.3329C30.4629 26.1421 30.2716 25.9518 30.0801 25.7616C29.8795 25.5622 29.6794 25.3622 29.4793 25.1623C29.1009 24.7846 28.7221 24.4073 28.3431 24.0302C27.9114 23.6005 27.4802 23.1703 27.049 22.7401C26.1627 21.8558 25.2757 20.9721 24.3883 20.0889C24.4677 19.9295 24.5471 19.7702 24.6266 19.6109C24.66 19.5437 24.66 19.5437 24.6941 19.4753C24.8179 19.2273 24.9446 18.9815 25.0758 18.7373C26.5262 15.8169 26.6727 12.1889 25.6496 9.11354C24.4801 5.73662 22.1068 3.03394 18.9101 1.43483C17.9242 0.958473 16.8936 0.636563 15.8258 0.401382C15.7764 0.390173 15.7269 0.378964 15.676 0.367416C11.9743 -0.430105 7.75373 0.723939 4.90151 3.18538ZM20.9508 5.21388C21.0034 5.26198 21.056 5.31008 21.1103 5.35963C23.087 7.25212 24.2535 10.0556 24.3437 12.7693C24.3914 15.2648 23.7046 17.4466 22.3661 19.5335C22.1666 19.8582 22.1034 20.1176 22.1859 20.4923C22.3561 20.9201 22.7387 21.2282 23.0613 21.5444C23.1381 21.6207 23.2148 21.6972 23.2914 21.7737C23.4561 21.9378 23.6212 22.1014 23.7868 22.2646C24.0486 22.5228 24.3093 22.7822 24.5699 23.0416C25.029 23.4986 25.4891 23.9546 25.9494 24.4104C26.6425 25.0969 27.335 25.784 28.0265 26.4721C28.2856 26.7299 28.5452 26.9871 28.8052 27.2439C28.9668 27.4038 29.1281 27.564 29.2893 27.7244C29.364 27.7985 29.4389 27.8726 29.514 27.9464C29.6166 28.0474 29.7186 28.1489 29.8205 28.2506C29.8776 28.3072 29.9348 28.3638 29.9938 28.4221C30.2737 28.745 30.3616 29.021 30.3478 29.439C30.3031 29.7437 30.1351 29.9117 29.9118 30.1084C29.696 30.2617 29.5733 30.2891 29.3102 30.2959C29.2519 30.2983 29.1935 30.3006 29.1334 30.303C28.7576 30.2482 28.497 29.9631 28.2382 29.7029C28.2064 29.6712 28.1746 29.6394 28.1419 29.6067C28.0362 29.5009 27.931 29.3947 27.8258 29.2886C27.7498 29.2123 27.6738 29.1362 27.5978 29.06C27.4345 28.8963 27.2715 28.7325 27.1086 28.5685C26.851 28.3092 26.5929 28.0505 26.3348 27.7917C25.7872 27.2427 25.2401 26.6932 24.693 26.1436C24.102 25.5498 23.5108 24.9561 22.9191 24.363C22.6625 24.1057 22.4061 23.8482 22.15 23.5904C21.9908 23.4302 21.8314 23.2704 21.6719 23.1106C21.5979 23.0363 21.524 22.962 21.4502 22.8876C21.3496 22.7861 21.2487 22.685 21.1476 22.584C21.0912 22.5272 21.0347 22.4705 20.9766 22.4121C20.6908 22.1548 20.458 22.1129 20.08 22.1194C19.7187 22.1797 19.4384 22.3887 19.1383 22.5889C17.7694 23.4492 16.3028 23.983 14.7008 24.2139C14.6569 24.2202 14.6129 24.2266 14.5677 24.2331C11.7626 24.5917 8.79654 23.7795 6.56078 22.0514C6.20032 21.7644 5.85438 21.4611 5.51333 21.1514C5.46515 21.1078 5.41697 21.0642 5.36733 21.0193C4.97476 20.6452 4.65146 20.2083 4.32583 19.7764C4.28579 19.7235 4.24574 19.6707 4.20449 19.6162C3.01473 17.982 2.20809 15.8681 2.18594 13.8347C2.18533 13.788 2.18472 13.7412 2.18409 13.6931C2.17314 12.6346 2.19498 11.6225 2.45083 10.5889C2.46153 10.543 2.47224 10.4971 2.48327 10.4498C2.82905 8.99765 3.54266 7.63989 4.45083 6.46388C4.49079 6.41111 4.53075 6.35834 4.57192 6.30397C6.35057 4.03687 9.01156 2.55273 11.8642 2.17287C15.2703 1.82715 18.4371 2.90369 20.9508 5.21388Z"
										fill="currentColor"
									/>
									<path
										d="M13.2485 4.19543C13.1693 4.19578 13.0901 4.19613 13.0085 4.19649C12.389 4.20447 11.8028 4.25203 11.2016 4.40246C11.1518 4.41487 11.102 4.42729 11.0507 4.44009C9.67923 4.79437 8.46393 5.41339 7.38911 6.33996C7.29847 6.41803 7.29847 6.41803 7.206 6.49767C5.57691 7.93045 4.43526 10.0992 4.26411 12.2775C4.21388 13.3812 4.23776 14.4526 4.51411 15.5275C4.52617 15.575 4.53824 15.6226 4.55067 15.6716C4.85299 16.8087 5.43414 17.9478 6.20161 18.84C6.24705 18.8932 6.29249 18.9465 6.3393 19.0013C6.47786 19.159 6.61991 19.3124 6.76411 19.465C6.81076 19.5156 6.8574 19.5663 6.90547 19.6185C8.49392 21.2857 10.8041 22.1697 13.081 22.2287C15.2757 22.2583 17.4135 21.5317 19.0766 20.09C19.1277 20.0465 19.1788 20.0029 19.2314 19.9581C20.3929 18.9441 21.2559 17.6684 21.7641 16.215C21.7784 16.1745 21.7926 16.134 21.8073 16.0923C22.5682 13.8769 22.3991 11.4074 21.3991 9.29723C20.6274 7.72833 19.4798 6.47455 18.0141 5.52746C17.9514 5.48588 17.8887 5.44431 17.8242 5.40148C16.4648 4.55139 14.836 4.18794 13.2485 4.19543ZM18.4985 8.43005C19.7374 9.83884 20.4472 11.6981 20.3371 13.5838C20.1918 15.3937 19.4257 17.2064 18.0424 18.4251C16.8436 19.4395 15.3643 20.2148 13.7641 20.2775C13.6935 20.2807 13.6228 20.2839 13.55 20.2872C11.495 20.336 9.67221 19.5735 8.18989 18.1681C6.82605 16.7483 6.16437 14.9362 6.17979 12.9784C6.21625 11.3414 6.83786 9.73691 7.95161 8.52746C7.98158 8.49484 8.01155 8.46222 8.04243 8.42861C8.91543 7.48919 9.94271 6.85435 11.1547 6.44152C11.1982 6.4266 11.2417 6.41168 11.2865 6.39631C13.8758 5.56196 16.6578 6.53352 18.4985 8.43005Z"
										fill="currentColor"
									/>
								</g>
								<defs>
									<clipPath id="clip0_mobile_search_field">
										<rect width="32" height="32" fill="white" transform="matrix(-1 0 0 1 32.2656 0.214844)" />
									</clipPath>
								</defs>
							</svg>
							<span className={`min-w-0 flex-1 truncate text-[clamp(13px,3.5vw,15px)] ${searchText ? "text-brand" : "text-brand-muted"}`}>
                                {searchText || "Find an event"}
							</span>
						</button>
						<button
							type="button"
							onClick={onOpenFullFilters}
							className="relative flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-surface-page shadow-[var(--shadow-app-sm)] active:scale-95"
                            aria-label="Categories and filters"
						>
							<img src="/icons/filter.svg" alt="" className="h-[18px] w-[18px]" width={18} height={18} />
							{selectedFiltersCount > 0 ? (
								<span className="absolute -right-[2px] -top-[3px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-[4px] text-[10px] font-[700] leading-none text-white shadow-[0_2px_7px_rgba(255,121,89,0.45)]">
									{selectedFiltersCount}
								</span>
							) : null}
						</button>
					</div>

					<motion.div
						className="pointer-events-auto w-full min-w-0"
						initial={{ opacity: 1 }}
						animate={{ opacity: filtersVisible ? 1 : 0, pointerEvents: filtersVisible ? "auto" : "none" }}
						transition={{ duration: 0.2 }}
					>
						<MobileFiltersBar
							selectedCategories={selectedCategories}
							setSelectedCategories={setSelectedCategories}
							mobileFilterDetails={mobileFilterDetails}
							setMobileFilterDetails={setMobileFilterDetails}
						/>
					</motion.div>
				</div>
			</div>

			<motion.div
				ref={sheetRef}
				style={{
					y: sheetY,
					bottom: `calc(${mobileNavHeight} + env(safe-area-inset-bottom, 0px) - ${SHEET_BOTTOM_NUDGE_PX}px)`,
					height: sheetSnap === "full" ? sheetFullHeight : sheetHeightBase,
					maxHeight: `calc(100dvh - ${mobileNavHeight} + ${SHEET_EXTRA_UP_PX + SHEET_BOTTOM_NUDGE_PX}px)`,
					paddingBottom: SHEET_BOTTOM_PADDING_PX,
				}}
				drag="y"
				dragControls={dragControls}
				dragListener={false}
				dragConstraints={{ top: 0, bottom: sheetDragMax > 0 ? sheetDragMax : 0 }}
				dragElastic={0.08}
				dragMomentum={false}
				onDragEnd={handleSheetDragEnd}
				className="absolute left-0 right-0 z-30 flex min-h-[44dvh] flex-col overflow-hidden rounded-t-[24px] bg-surface-page shadow-[var(--shadow-app-sheet)]"
			>
				<div className="relative flex w-full shrink-0 flex-col items-center justify-center pt-2.5 pb-1">
					<button
						type="button"
						className="absolute inset-x-0 -top-4 h-11 touch-none outline-none"
                        aria-label={sheetSnap === "peek" ? "Expand list" : "Collapse list and show map"}
						onClick={toggleSheet}
						onPointerDown={(e) => dragControls.start(e)}
					/>
					<div className="pointer-events-none relative -top-[6px] h-1 w-10 rounded-full bg-accent" />
				</div>
				<div className="relative flex min-h-0 flex-1 flex-col">
					<PullToRefreshScrollView
						wrapperClassName="min-h-0 flex-1"
						scrollClassName="h-full overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y"
						scrollStyle={{
							paddingBottom: SHEET_SCROLL_BOTTOM_PADDING,
							touchAction: isSheetCollapsed ? "none" : "pan-y",
						}}
						contentClassName="min-h-full"
						pullTriggerPx={44}
						allowInteractivePull
						onPullProgress={handleSheetPullProgress}
						onPullComplete={handleSheetPullComplete}
						hidePullIndicator
						moveContentOnPull={false}
					>
						{children}
					</PullToRefreshScrollView>

					{isSheetOpening ? (
						<div
							className="absolute inset-0 z-20 touch-none"
							onPointerDown={(event) => {
								event.preventDefault();
								event.stopPropagation();
							}}
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
							}}
							aria-hidden="true"
						/>
					) : null}

					{isSheetCollapsed ? (
						<button
							type="button"
							className="absolute inset-0 z-10 flex w-full touch-none items-start bg-surface-page px-[18px] pt-[1px] text-left"
                            aria-label="Expand interesting events list"
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								openCollapsedSheet();
							}}
							onPointerDown={handleCollapsedSheetPointerDown}
							onPointerMove={handleCollapsedSheetPointerMove}
							onPointerUp={handleCollapsedSheetPointerUp}
							onPointerCancel={() => {
								collapsedSheetPointerStartYRef.current = null;
								collapsedSheetShouldOpenRef.current = false;
							}}
						>
							<span className="text-display text-[20px] text-brand">
                                Interesting events
							</span>
						</button>
					) : null}
				</div>
			</motion.div>
		</div>
	);
}
