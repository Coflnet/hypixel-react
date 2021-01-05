import { useState } from "react";

export function useForceUpdate() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [update, setUpdate] = useState(0);
    return () => setUpdate(update => update + 1);
}