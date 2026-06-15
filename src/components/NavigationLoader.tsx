import { useRef } from "react";

type Loader = {
	start: () => void;
	done: () => void;
};

// Minimal navigation loader hook used by a few components during navigation.
export function useNavigationLoader(): Loader {
	const busy = useRef(false);
	return {
		start: () => {
			busy.current = true;
		},
		done: () => {
			busy.current = false;
		},
	};
}

export default function NavigationLoader() {
	return null;
}
