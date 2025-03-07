
import { MaintenanceRequest } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

interface MaintenanceRequestListProps {
  requests: MaintenanceRequest[];
  isLoading: boolean;
  error?: string;
}

export function MaintenanceRequestList({ requests, isLoading, error }: MaintenanceRequestListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader className="p-4">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Maintenance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No maintenance requests found.</p>
        </CardContent>
      </Card>
    );
  }

  const priorityColors = {
    emergency: "destructive",
    high: "destructive", 
    medium: "warning",
    low: "secondary"
  };

  const statusColors = {
    pending: "secondary",
    assigned: "warning",
    in_progress: "primary",
    completed: "success",
    cancelled: "destructive"
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map(request => (
            <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell className="font-medium">{request.title}</TableCell>
              <TableCell>{request.unit}</TableCell>
              <TableCell className="capitalize">{request.category.replace('_', ' ')}</TableCell>
              <TableCell>
                <Badge variant={priorityColors[request.priority] as any}>
                  {request.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[request.status] as any}>
                  {request.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
