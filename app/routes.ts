import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  layout("./employee/layout.tsx", [
    route('dashboard/employee/:userId', "./employee/dashboard.tsx"),
    route('dashboard/employee/:userId/apply-leave', "./employee/applyLeave.tsx"),
    route('dashboard/employee/:userId/my-leaves', "./employee/myLeaves.tsx"),
    route('dashboard/employee/:userId/calendar', "./employee/leaveCalendar.tsx"),
    route('dashboard/employee/:userId/profile', "./employee/profile.tsx"),
  ],
  ),
  layout("./admin/layout.tsx", [
    route("dashboard/admin/:userId", "./admin/dashboard.tsx")
  ]),
  route("dashboard/manager/:userId", "./manager/dashboard.tsx")
] satisfies RouteConfig;
