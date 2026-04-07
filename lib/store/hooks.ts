import { useDispatch, useSelector, useStore } from "react-redux";
import type { RootState, AppDispatch, AppStore } from "./index";

// Typed hooks for use throughout the application
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

// Custom selectors
export const useAuth = () => useAppSelector((state) => state.auth);
export const useUser = () => useAppSelector((state) => state.user);
export const useUI = () => useAppSelector((state) => state.ui);

// Auth selectors
export const useIsAuthenticated = () =>
  useAppSelector((state) => state.auth.isAuthenticated);
export const useCurrentUser = () => useAppSelector((state) => state.auth.user);
export const useAuthToken = () => useAppSelector((state) => state.auth.token);
export const useAuthLoading = () =>
  useAppSelector((state) => state.auth.isLoading);
export const useAuthError = () => useAppSelector((state) => state.auth.error);

// User selectors
export const useStudents = () => useAppSelector((state) => state.user.students);
export const useSelectedStudent = () =>
  useAppSelector((state) => state.user.selectedStudent);
export const useAssessments = () =>
  useAppSelector((state) => state.user.assessments);
export const useUserLoading = () =>
  useAppSelector((state) => state.user.isLoading);
export const useUserPagination = () =>
  useAppSelector((state) => state.user.pagination);
export const useUserFilters = () =>
  useAppSelector((state) => state.user.filters);

// UI selectors
export const useSidebarOpen = () =>
  useAppSelector((state) => state.ui.sidebarOpen);
export const useSidebarCollapsed = () =>
  useAppSelector((state) => state.ui.sidebarCollapsed);
export const useTheme = () => useAppSelector((state) => state.ui.theme);
export const useToasts = () => useAppSelector((state) => state.ui.toasts);
export const useModal = (id: string) =>
  useAppSelector((state) => state.ui.modals[id]);
export const useGlobalLoading = () =>
  useAppSelector((state) => ({
    isLoading: state.ui.isLoading,
    message: state.ui.globalLoadingMessage,
  }));
