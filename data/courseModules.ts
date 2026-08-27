export interface CourseModule {
  no: string;
  title: string;
  status: string;
}

export const courseModules: CourseModule[] = [
  { no: "01", title: "The canvas — nodes, connections, and the run log", status: "week 1" },
  { no: "02", title: "HTTP and webhooks — talking to anything", status: "week 2" },
  { no: "03", title: "Data shaping — JSON in, JSON out", status: "week 3" },
  { no: "04", title: "Failure — retries, error triggers, alerts", status: "week 4" },
  { no: "05", title: "Storage — Supabase, sheets, queues", status: "week 5" },
  { no: "06", title: "Shipping — handing a workflow to a client", status: "week 6" },
];
