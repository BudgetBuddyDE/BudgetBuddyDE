"use client";

import React from "react";

export const useEnhancedEffect =
	typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
