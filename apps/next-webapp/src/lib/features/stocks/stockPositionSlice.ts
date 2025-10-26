import { AssetService } from "@/services/Stock";
import { createEntitySlice } from "../createEntitySlice";

export const stockPositionSlice = createEntitySlice("stockPosition", (query) =>
	AssetService.positions.getWithCount(query),
);
