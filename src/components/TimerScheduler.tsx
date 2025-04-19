
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { Timer, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ScheduledTransaction {
  id: string;
  functionName: string;
  contractAddress: string;
  args: any[];
  value: string;
  scheduledTime: number;
  executionCallback: () => Promise<void>;
}

interface TimerSchedulerProps {
  onSchedule: (scheduledTime: number, callback: () => Promise<void>) => void;
  functionName: string;
  contractAddress: string;
  isActive?: boolean; // Whether scheduling is active or not
}

const TimerScheduler: React.FC<TimerSchedulerProps> = ({
  onSchedule,
  functionName,
  contractAddress,
  isActive = true,
}) => {
  const [isSchedulingEnabled, setIsSchedulingEnabled] = useState<boolean>(false);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Update current time every second
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };
    
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleSchedule = () => {
    if (!scheduledTime) {
      toast.error('Please set a valid time for scheduling');
      return;
    }
    
    // Parse scheduled time
    const [hours, minutes, seconds] = scheduledTime.split(':').map(Number);
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, seconds || 0, 0);
    
    // If time is in the past for today, schedule for tomorrow
    const now = new Date();
    if (scheduledDate.getTime() < now.getTime()) {
      toast.error('Scheduled time must be in the future');
      return;
    }
    
    const timeDiff = scheduledDate.getTime() - now.getTime(); // in milliseconds
    
    toast.success(`Transaction scheduled for ${scheduledTime}`, {
      description: `Execution in ${Math.floor(timeDiff / 60000)} minutes ${Math.floor((timeDiff % 60000) / 1000)} seconds`
    });
    
    onSchedule(scheduledDate.getTime(), () => {
      return Promise.resolve();
    });
  };
  
  return (
    <Card className="border border-cyber-accent/30 bg-cyber-dark/50 mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-cyber-accent" />
            <CardTitle className="text-sm font-mono">Schedule Transaction</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="schedule-mode"
              checked={isSchedulingEnabled}
              onCheckedChange={setIsSchedulingEnabled}
              disabled={!isActive}
            />
            <Label htmlFor="schedule-mode" className="text-xs">
              {isSchedulingEnabled ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        </div>
        <CardDescription className="pt-1 text-xs">
          Current time: <span className="font-mono">{currentTime}</span>
        </CardDescription>
      </CardHeader>
      
      {isSchedulingEnabled && (
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="scheduled-time" className="text-sm font-mono">
                  Execution Time (24h format)
                </Label>
                <Badge variant="outline" className="font-mono text-xs">
                  {functionName}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  id="scheduled-time"
                  type="time"
                  step="1"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="cyber-input font-mono"
                  disabled={!isActive}
                />
                <Button 
                  onClick={handleSchedule} 
                  disabled={!isActive || !scheduledTime}
                  className="cyber-button-alt"
                >
                  Schedule
                </Button>
              </div>
              
              <div className="text-amber-500 text-xs mt-2 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  Keep the app open until execution time. Scheduled transactions are only stored in memory and will be lost if you close the app.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default TimerScheduler;
