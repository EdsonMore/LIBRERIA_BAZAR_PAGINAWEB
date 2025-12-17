"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormularioVenta } from "@/components/ventas/formulario-venta";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export default function VentasPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [propietarios, setPropietarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const verificarAutenticacion = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/auth/login");
          return;
        }
        const data = await res.json();
        if (data?.usuario) {
          setUsuario(data.usuario);
          // Cargar lista de propietarios (usuarios del sistema)
          cargarPropietarios();
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        router.push("/auth/login");
      }
    };

    verificarAutenticacion();
  }, [router]);

  const cargarPropietarios = async () => {
    try {
      setCargando(true);
      const response = await fetch("/api/usuarios");
      if (response.ok) {
        const data = await response.json();
        setPropietarios(data.usuarios || []);
      }
    } catch (error) {
      console.error("Error al cargar propietarios:", error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 py-6 md:py-8 flex-1">
          {/* Header - Responsivo */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  📝 Registro de Ventas
                </h1>
                <p className="text-sm md:text-base text-slate-600 mt-1 md:mt-2">
                  Registra tus ventas de forma rápida y eficiente
                </p>
              </div>
            </div>
          </div>

          {/* Formulario - Responsivo */}
          <div className="bg-white rounded-lg">
            <FormularioVenta
              vendedorId={usuario?.id as number}
              usuarioId={usuario?.id as number}
              propietarios={propietarios}
              onVentaRegistrada={(ventaId) => {
                console.log("Venta registrada:", ventaId);
              }}
            />
          </div>

          {/* Info - Responsivo */}
          <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-lg border border-blue-200">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
                ⚡
              </div>
              <h3 className="font-semibold text-slate-900 text-sm md:text-base">
                Registro Rápido
              </h3>
              <p className="text-slate-600 text-xs md:text-sm mt-2">
                Registra ventas en segundos
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-6 rounded-lg border border-green-200">
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
                📦
              </div>
              <h3 className="font-semibold text-slate-900 text-sm md:text-base">
                Productos Flexibles
              </h3>
              <p className="text-slate-600 text-xs md:text-sm mt-2">
                Productos existentes o nuevos
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-lg border border-purple-200">
              <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">
                📊
              </div>
              <h3 className="font-semibold text-slate-900 text-sm md:text-base">
                Reportes Detallados
              </h3>
              <p className="text-slate-600 text-xs md:text-sm mt-2">
                Análisis completo de ventas
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
