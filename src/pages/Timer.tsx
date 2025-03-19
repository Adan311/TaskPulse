
import { AppLayout } from "@/components/AppLayout";
import { TimerControls } from "@/components/Timer/TimerControls";
import { TimerDisplay } from "@/components/Timer/TimerDisplay";
import { Separator } from "@/components/ui/separator";
import TimerHistory from "@/components/Timer/TimerHistory";

const Timer = () => {
  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row h-full">
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-md mx-auto space-y-8">
            <TimerDisplay />
            <Separator className="my-6" />
            <TimerControls />
          </div>
        </div>
        
        <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l">
          <TimerHistory />
        </div>
      </div>
    </AppLayout>
  );
};

export default Timer;
