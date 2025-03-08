
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building } from "lucide-react";

interface UnitManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUnitCount: number;
  onSave: (unitCount: number) => void;
}

export function UnitManagementModal({
  isOpen,
  onClose,
  currentUnitCount,
  onSave,
}: UnitManagementModalProps) {
  const [unitCount, setUnitCount] = useState(currentUnitCount);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setUnitCount(value);
    
    if (isNaN(value) || value <= 0) {
      setError("Unit count must be a positive number");
    } else {
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!error && unitCount > 0) {
      onSave(unitCount);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Property Units Management</DialogTitle>
          <DialogDescription>
            Update the total number of units in your property.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="unitCount">
                Total Units
              </Label>
              <div className="flex items-center">
                <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="unitCount"
                  type="number"
                  min="1"
                  value={unitCount}
                  onChange={handleChange}
                  className={error ? "border-destructive" : ""}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!!error || unitCount <= 0}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
