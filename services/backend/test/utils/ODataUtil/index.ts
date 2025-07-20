export * from "./ODataUtil";

export interface ODataQueryOptions {
  $select?: string;
  $expand?: string;
  $filter?: string;
  $orderby?: string;
  $top?: number;
  $skip?: number;
  $count?: boolean;
  $search?: string;
}
