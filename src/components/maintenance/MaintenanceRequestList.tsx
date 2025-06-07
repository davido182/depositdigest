
import { MaintenanceRequest } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";

interface MaintenanceRequestListProps {
  requests: MaintenanceRequest[];
  isLoading: boolean;
  error?: string;
  onStatusChange: (id: string, newStatus: MaintenanceRequest['status']) => void;
  onDelete: (id: string) => void;
}

export function MaintenanceRequestList({ 
  requests, 
  isLoading, 
  error,
  onStatusChange,
  onDelete 
}: MaintenanceRequestListProps) {
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
    medium: "default",
    low: "secondary"
  };

  const statusColors = {
    pending: "secondary",
    assigned: "default",
    in_progress: "default",
    completed: "secondary",
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
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map(request => (
            <TableRow key={request.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{request.title}</TableCell>
              <TableCell>{request.unit}</TableCell>
              <TableCell className="capitalize">{request.category.replace('_', ' ')}</TableCell>
              <TableCell>
                <Badge variant={priorityColors[request.priority] as any}>
                  {request.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Select 
                  value={request.status} 
                  onValueChange={(value) => onStatusChange(request.id, value as MaintenanceRequest['status'])}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      <Badge variant={statusColors[request.status] as any}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="assigned">Asignado</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(request.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
