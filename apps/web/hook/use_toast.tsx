import toast from "react-hot-toast";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ShowFancyToastProps {
  title: string;
  description?: string;
  type?: ToastType;
}

export function showFancyToast(props: ShowFancyToastProps) {
  const { title, description, type = "success" } = props;

  const iconMap = {
    success: <CheckCircle className="text-green-500 w-6 h-6" />,
    error: <AlertCircle className="text-red-500 w-6 h-6" />,
    info: <Info className="text-blue-500 w-6 h-6" />,
  };

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-96  bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 ${
          type === "success"
            ? "border-green-500"
            : type === "error"
              ? "border-red-500"
              : "border-blue-500"
        }`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">{iconMap[type]}</div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    { duration: 3000 }
  );
}
