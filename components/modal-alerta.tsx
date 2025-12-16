"use client"

import { AlertCircle, CheckCircle, X, LogIn } from "lucide-react"

interface ModalAlertaProps {
  isOpen: boolean
  title: string
  message: string
  type: "error" | "success" | "warning" | "info"
  onClose: () => void
  buttons?: {
    label: string
    onClick: () => void
    variant?: "primary" | "secondary" | "danger"
  }[]
}

export default function ModalAlerta({
  isOpen,
  title,
  message,
  type,
  onClose,
  buttons,
}: ModalAlertaProps) {
  if (!isOpen) return null

  const iconMap = {
    error: <AlertCircle className="w-12 h-12 text-red-500" />,
    success: <CheckCircle className="w-12 h-12 text-green-500" />,
    warning: <AlertCircle className="w-12 h-12 text-yellow-500" />,
    info: <AlertCircle className="w-12 h-12 text-blue-500" />,
  }

  const bgColorMap = {
    error: "bg-red-50",
    success: "bg-green-50",
    warning: "bg-yellow-50",
    info: "bg-blue-50",
  }

  const borderColorMap = {
    error: "border-red-200",
    success: "border-green-200",
    warning: "border-yellow-200",
    info: "border-blue-200",
  }

  const defaultButtons =
    buttons ||
    [
      {
        label: "Cerrar",
        onClick: onClose,
        variant: "primary" as const,
      },
    ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`${bgColorMap[type]} border-2 ${borderColorMap[type]} rounded-lg shadow-2xl max-w-md w-full p-6 transform transition-all`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">{iconMap[type]}</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-700 mb-6 leading-relaxed">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3">
          {defaultButtons.map((btn, idx) => {
            const variantClasses = {
              primary: "bg-[#667eea] text-white hover:bg-blue-700",
              secondary: "bg-gray-300 text-gray-700 hover:bg-gray-400",
              danger: "bg-red-600 text-white hover:bg-red-700",
            }

            return (
              <button
                key={idx}
                onClick={btn.onClick}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  variantClasses[btn.variant || "primary"]
                }`}
              >
                {btn.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
