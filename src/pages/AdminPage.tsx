import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader,
  Users,
  UserX,
  UserCheck,
  Receipt,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import {
  expenseService,
  AdminStats,
  UserWithStats,
  UserExpense,
  SystemLog,
} from "@/lib/expense-service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

// Helper to format relative time
function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return "Never";

  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 30) return `${Math.floor(days / 30)} months ago`;
  if (days > 0) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  return "Just now";
}

// Helper to format date
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Stats Card Component
const StatCard: React.FC<{
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
}> = ({ title, value, description, icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </CardContent>
  </Card>
);

// User Row Component with expandable expenses
const UserRow: React.FC<{
  user: UserWithStats;
  currentUserEmail: string;
  currentUserRole: string | null;
  onViewExpenses: (email: string) => void;
  isLoadingExpenses: boolean;
  expenses: UserExpense[] | null;
  isExpanded: boolean;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  onSetRole: (userId: string, newRole: 'user' | 'admin') => void;
  onDelete: (user: UserWithStats) => void;
  isUpdatingStatus: boolean;
}> = ({ user, currentUserEmail, currentUserRole, onViewExpenses, isLoadingExpenses, expenses, isExpanded, onToggleStatus, onSetRole, onDelete, isUpdatingStatus }) => {
  const lastActive = user.last_active_at || user.lastExpenseAt;
  const isActive =
    lastActive &&
    Date.now() - lastActive < 5 * 60 * 1000; // Active in last 5 minutes

  const isSelf = user.email === currentUserEmail;
  const isSuperAdmin = currentUserRole === 'super_admin';

  return (
    <>
      <TableRow
        className={`cursor-pointer hover:bg-muted/50 ${user.is_active === 0 ? "opacity-60 bg-red-50 dark:bg-red-950/10" : ""}`}
        onClick={() => onViewExpenses(user.email)}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {user.email}
            {user.role === 'admin' && <Badge variant="default" className="text-xs bg-purple-600 hover:bg-purple-700">Admin</Badge>}
            {user.role === 'super_admin' && <Badge variant="default" className="text-xs bg-amber-600 hover:bg-amber-700">Super Admin</Badge>}
            {user.is_active === 0 && <Badge variant="destructive" className="text-xs">Banned</Badge>}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={user.email_verified ? "default" : "secondary"}>
            {user.email_verified ? "Verified" : "Unverified"}
          </Badge>
        </TableCell>
        <TableCell>{formatDate(user.created_at)}</TableCell>
        <TableCell>{user.expenseCount}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {isActive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            <span
              className={
                isActive
                  ? "text-green-600 dark:text-green-400 font-medium"
                  : "text-muted-foreground"
              }
            >
              {formatRelativeTime(lastActive)}
            </span>
          </div>
        </TableCell>
        <TableCell>{user.settings?.aiProvider || "gemini"}</TableCell>
        <TableCell>{user.settings?.currency || "USD"}</TableCell>
        <TableCell>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            {isSuperAdmin && !isSelf && (
              <>
                {user.role === 'admin' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => onSetRole(user.id, 'user')}
                    title="Demote to User"
                  >
                    Demote
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => onSetRole(user.id, 'admin')}
                    title="Promote to Admin"
                  >
                    Promote
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  disabled={isUpdatingStatus}
                  onClick={() => onDelete(user)}
                  title="Delete User"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              disabled={isUpdatingStatus || isSelf}
              onClick={() => onToggleStatus(user.id, user.is_active !== 0)}
              title={user.is_active !== 0 ? "Ban User" : "Unban User"}
            >
              {isUpdatingStatus ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : user.is_active !== 0 ? (
                <UserX className="h-4 w-4 text-destructive" />
              ) : (
                <UserCheck className="h-4 w-4 text-green-600" />
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={9} className="bg-muted/30 p-4">
            {isLoadingExpenses ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="h-6 w-6 animate-spin" />
              </div>
            ) : expenses && expenses.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm mb-3">
                  Recent Expenses (Last 100)
                </h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Line Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.slice(0, 10).map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{expense.date}</TableCell>
                          <TableCell>{expense.merchant}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {expense.currency} {expense.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {expense.lineItems.length > 0 ? (
                              <span className="text-muted-foreground">
                                {expense.lineItems.length} items
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {expenses.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing 10 of {expenses.length} expenses
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No expenses found
              </p>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userExpenses, setUserExpenses] = useState<
    Record<string, UserExpense[]>
  >({});

  const [loadingExpenses, setLoadingExpenses] = useState<string | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [aiStats, setAiStats] = useState<{
    totalRequests: number;
    successRate: number;
    avgDuration: number;
    providerBreakdown: { provider: string; count: number }[];
    dailyStats: { date: string; count: number; avgDuration: number }[];
  } | null>(null);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    setIsLoading(true);

    // Check if user is admin
    // We can get email from expenseService.getExpenses() call technically, 
    // or we assume backend validates it. But for UI strictness we might want it.
    // Ideally checkAdmin returns email too? No, it returns role.
    // Let's get "Me" to get email.

    // Parallel check to speed up
    const adminCheck = await expenseService.checkAdmin();

    if (!adminCheck.success || !adminCheck.isAdmin) {
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }

    setIsAuthorized(true);
    // @ts-ignore - we know role exists now in our modified service but TS might complain if types aren't synced
    const role = (adminCheck as any).role || 'admin';
    setCurrentUserRole(role);

    // Get my own profile to know my email (to prevent self-ban/demote UI)
    // Actually, `expenseService` doesn't expose `me`. 
    // We'll assume the user knows who they are, or we fetch it.
    // For now, let's fetch users and fuzzy match or just rely on backend protection.
    // But UI is better if we disable buttons for self.
    // Let's try to get /auth/me via a raw fetch or add it to service?
    // Start with data load.

    // Load stats and users in parallel
    const [statsResult, usersResult, aiResult] = await Promise.all([
      expenseService.getAdminStats(),
      expenseService.getAdminUsers(),
      expenseService.getAIAnalytics()
    ]);

    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data);
    } else {
      toast.error("Failed to load stats");
    }

    if (usersResult.success && usersResult.data) {
      setUsers(usersResult.data);
      // Try to guess current user email? 
      // Actually, we can decode the token or just hit /auth/me. 
      // Or just let the backend handle the "cannot modify self" error and toast it.
      // That is simpler for now.
    } else {
      toast.error("Failed to load users");
    }

    if (aiResult.success && aiResult.data) {
      setAiStats(aiResult.data);
    }

    setIsLoading(false);
  };

  const handleViewExpenses = async (email: string) => {
    if (expandedUser === email) {
      setExpandedUser(null);
      return;
    }

    setExpandedUser(email);

    if (userExpenses[email]) {
      return; // Already loaded
    }

    setLoadingExpenses(email);
    const result = await expenseService.getAdminUserExpenses(email);

    if (result.success && result.data) {
      setUserExpenses((prev) => ({ ...prev, [email]: result.data! }));
    } else {
      toast.error(`Failed to load expenses for ${email}`);
    }

    setLoadingExpenses(null);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (updatingUser) return;

    // Confirm action
    let banReason: string | undefined;
    if (currentStatus) {
      // If currently active, we are banning
      const reason = prompt("Enter a reason for banning this user (optional):");
      if (reason === null) return; // Cancelled
      banReason = reason;
    }

    setUpdatingUser(userId);
    const newStatus = !currentStatus; // Toggle

    const result = await expenseService.toggleUserStatus(userId, newStatus, banReason);

    if (result.success) {
      toast.success(`User ${newStatus ? 'unbanned' : 'banned'} successfully`);
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: newStatus ? 1 : 0 } : u));
    } else {
      toast.error(result.error || "Failed to update user status");
    }

    setUpdatingUser(null);
  };

  const handleSetRole = async (userId: string, newRole: 'user' | 'admin') => {
    if (updatingUser) return;

    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    setUpdatingUser(userId);
    const result = await expenseService.setUserRole(userId, newRole);

    if (result.success) {
      toast.success(`User role updated to ${newRole}`);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      toast.error(result.error || "Failed to update user role");
    }
    setUpdatingUser(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    const toastId = toast.loading("Deleting user...");

    try {
      const result = await expenseService.deleteUser(userToDelete.id);

      if (result.success) {
        toast.success("User deleted successfully", { id: toastId });
        await checkAdminAndLoadData();
      } else {
        toast.error(result.error || "Failed to delete user", { id: toastId });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user", { id: toastId });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    const result = await expenseService.getSystemLogs();
    if (result.success && result.data) {
      setLogs(result.data);
    } else {
      toast.error("Failed to load system logs");
    }
    setLoadingLogs(false);
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show 404 for non-admins
  if (!isLoading && !isAuthorized) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-8">Page not found</p>
        <Button onClick={() => navigate("/home")}>Go Home</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-16">
          <Loader className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          System analytics and user management
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="logs" onClick={loadLogs}>System Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              description={`+${stats?.newUsersThisWeek || 0} this week`}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Active Users (7d)"
              value={stats?.activeUsers7Days || 0}
              description="Users with expenses in last 7 days"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Total Expenses"
              value={stats?.totalExpenses || 0}
              description={`+${stats?.expensesThisWeek || 0} this week`}
              icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Today's Activity"
              value={stats?.expensesToday || 0}
              description={`${stats?.newUsersToday || 0} new users`}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          {/* Breakdowns */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category Breakdown</CardTitle>
                <CardDescription>
                  Expense distribution by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.categoryBreakdown &&
                  stats.categoryBreakdown.length > 0 ? (
                  <div className="space-y-2">
                    {stats.categoryBreakdown.map((cat) => (
                      <div
                        key={cat.category}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm">{cat.category}</span>
                        <Badge variant="secondary">{cat.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>

            {/* AI Provider Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  AI Provider Preferences
                </CardTitle>
                <CardDescription>User provider selections</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.aiProviderBreakdown &&
                  stats.aiProviderBreakdown.length > 0 ? (
                  <div className="space-y-2">
                    {stats.aiProviderBreakdown.map((provider) => (
                      <div
                        key={provider.provider}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm capitalize">
                          {provider.provider}
                        </span>
                        <Badge variant="secondary">{provider.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>

            {/* Currency Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Currency Distribution
                </CardTitle>
                <CardDescription>Default currency preferences</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.currencyBreakdown &&
                  stats.currencyBreakdown.length > 0 ? (
                  <div className="space-y-2">
                    {stats.currencyBreakdown.map((curr) => (
                      <div
                        key={curr.currency}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm">{curr.currency}</span>
                        <Badge variant="secondary">{curr.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Placeholder for future AI analytics */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Coming Soon: AI Processing Analytics</AlertTitle>
            <AlertDescription>
              Input/output logging for receipt processing will be added in a
              future update. This will include processing times, success rates,
              and error analysis.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
            </span>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Expenses</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>AI Provider</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>AI Provider</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        currentUserEmail={currentUserEmail}
                        currentUserRole={currentUserRole}
                        onViewExpenses={handleViewExpenses}
                        isLoadingExpenses={loadingExpenses === user.email}
                        expenses={userExpenses[user.email] || null}
                        isExpanded={expandedUser === user.email}
                        onToggleStatus={handleToggleStatus}
                        onSetRole={handleSetRole}
                        onDelete={setUserToDelete}
                        isUpdatingStatus={updatingUser === user.id}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">System Logs</h3>
            <Button variant="outline" size="sm" onClick={loadLogs} disabled={loadingLogs}>
              {loadingLogs ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
              Refresh
            </Button>
          </div>
          <Card>
            <div className="overflow-x-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {loadingLogs ? "Loading logs..." : "No logs found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'secondary' : 'outline'}>
                            {log.level.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.message}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-md truncate" title={log.details || ''}>
                          {log.details || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* AI Metrics Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total AI Requests"
              value={aiStats?.totalRequests || 0}
              description="Last 30 days"
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Success Rate"
              value={`${aiStats?.successRate.toFixed(1) || 0}%`}
              description="Processing reliability"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Avg Latency"
              value={`${aiStats?.avgDuration || 0}ms`}
              description="Per receipt"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Daily Usage Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Usage Trend</CardTitle>
                <CardDescription>Requests per day (Last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aiStats?.dailyStats || []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Bar dataKey="count" name="Requests" fill="#0088FE" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Response Time Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latency Trend</CardTitle>
                <CardDescription>Average processing time (ms)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={aiStats?.dailyStats || []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                      <YAxis unit="ms" />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line type="monotone" dataKey="avgDuration" name="Avg Duration" stroke="#00C49F" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Provider Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Provider Distribution</CardTitle>
                <CardDescription>Requests by AI Provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aiStats?.providerBreakdown || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="provider"
                      >
                        {aiStats?.providerBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Success Rate Visual */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reliability Score</CardTitle>
                <CardDescription>Success vs Failure Ratio</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2 text-green-500">
                    {aiStats?.successRate.toFixed(1) || 0}%
                  </div>
                  <p className="text-muted-foreground">Successful Requests</p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Based on {aiStats?.totalRequests || 0} total interactions
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Stats Placeholder */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    New Users
                  </span>
                  <span className="font-medium">
                    {stats?.newUsersThisMonth || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Expenses Created
                  </span>
                  <span className="font-medium">
                    {stats?.expensesThisMonth || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    New Users
                  </span>
                  <span className="font-medium">
                    {stats?.newUsersThisWeek || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Expenses Created
                  </span>
                  <span className="font-medium">
                    {stats?.expensesThisWeek || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    New Users
                  </span>
                  <span className="font-medium">
                    {stats?.newUsersToday || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Expenses Created
                  </span>
                  <span className="font-medium">
                    {stats?.expensesToday || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              for <strong>{userToDelete?.email}</strong> and remove all their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
};
