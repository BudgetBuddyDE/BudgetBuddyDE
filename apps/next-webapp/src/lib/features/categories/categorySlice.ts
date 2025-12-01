import { NewCategoryService } from "@/services/Category.service";
import { createEntitySlice } from "../createEntitySlice";

export const categorySlice = createEntitySlice("category", (query) =>
	new NewCategoryService().getAll(query),
);
