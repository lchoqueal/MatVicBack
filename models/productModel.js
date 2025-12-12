import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, CreditCard, ArrowLeft, Image as ImageIcon } from 'lucide-react';

// --- IMPORTS CLAVE ---
import { addToCart } from '../../admin/api'; // Tu función inteligente de la API (Ajusta la ruta si es necesario)
import { useAuth } from '../../contexts/AuthContext'; // Tu contexto de seguridad (Ajusta la ruta si es necesario)
import LoginOrRegisterModal from '../../components/LoginOrRegisterModal'; // El nuevo modal con blur

// NOTA: Asumo que ProductImage no es estrictamente necesario aquí si usamos la etiqueta <img>

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 1. Estados de Autenticación y Carga
  const { token, isAuthenticated } = useAuth(); 

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false); // Estado de "Cargando" del botón
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado del modal Login/Registro

  // 2. CARGAR PRODUCTO y Abrir Modal
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "https://matvicback-develop.onrender.com/api";
    
    // FETCH DE DATOS
    fetch(`${apiUrl}/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Producto no encontrado");
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
      
    // ABRIR MODAL AUTOMÁTICAMENTE SI NO ESTÁ LOGUEADO
    if (!isAuthenticated) {
        const timer = setTimeout(() => {
            setIsModalOpen(true);
        }, 500); // 0.5s de delay para que la UI cargue

        return () => clearTimeout(timer); // Limpieza
    }

  }, [id, isAuthenticated]); // Dependencias: Si el ID cambia o la autenticación cambia, se re-evalúa

  // 3. LÓGICA DE AGREGAR AL CARRITO (CON SEGURIDAD)
  const handleAddToCart = async (isBuyNow = false) => {
    // A) Verificación Frontend: Si no está logueado, forzamos el modal (Plan B)
    if (!token || !isAuthenticated) {
      setIsModalOpen(true);
      return; 
    }

    setAdding(true);
    try {
      // B) Llamada al Backend (usa product.id_producto y el token)
      await addToCart(product.id_producto, quantity, token);

      if (isBuyNow) {
        navigate('/store/cart'); 
      } else {
        alert("¡Producto agregado al carrito exitosamente! 🛒");
      }
    } catch (error) {
      console.error(error);
      // C) Manejo de Token Expirado (Si el backend devuelve 401/403)
      if (error.message.includes("401") || error.message.includes("403")) {
        alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
        navigate('/login');
      } else {
        alert(error.message || "Error al agregar al carrito");
      }
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando detalles...</div>;
  if (!product) return <div className="p-10 text-center">Producto no encontrado</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Botón Volver */}
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 mb-6 hover:text-black">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a la tienda
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* === COLUMNA IZQUIERDA: IMÁGENES === */}
        <div className="flex gap-4 h-[500px]">
          
          {/* Tira de miniaturas */}
          <div className="flex flex-col gap-3 overflow-y-auto pr-1 scrollbar-hide">
             {[0, 1, 2, 3].map((index) => (
                <div 
                  key={index} 
                  className={`w-20 h-24 flex-shrink-0 border rounded-xl cursor-pointer p-2 bg-white transition-all duration-200
                    ${index === 0 ? 'border-black ring-1 ring-black shadow-md' : 'border-gray-200 hover:border-gray-400'}`}
                >
                   {product.imagen_url ? (
                     <img 
                        src={product.imagen_url} 
                        alt={`Vista ${index}`} 
                        className="w-full h-full object-contain" 
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ImageIcon className="w-8 h-8" />
                     </div>
                   )}
                </div>
             ))}
          </div>

          {/* Imagen Principal */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center relative shadow-sm h-full">
             {product.imagen_url ? (
                <img 
                  src={product.imagen_url} 
                  alt={product.nombre} 
                  className="w-full h-full object-contain max-h-[450px]" 
                />
             ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                   <ImageIcon className="w-32 h-32 mb-4 opacity-20" />
                   <span className="text-gray-400 font-medium">Sin imagen</span>
                </div>
             )}
             
             <span className="absolute top-6 left-6 bg-black text-white text-xs px-3 py-1.5 rounded-full font-bold tracking-wider shadow-lg">
               NUEVO
             </span>
          </div>
        </div>

        {/* === COLUMNA DERECHA: INFORMACIÓN === */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.nombre}</h1>
          
          <div className="flex items-center mb-6">
            <span className="text-4xl font-bold text-gray-900">${product.precio_unit}</span>
            <div className="ml-4 flex items-center text-yellow-500">
               ★★★★★ <span className="text-gray-400 text-sm ml-1">(4.8)</span>
            </div>
          </div>

          {/* Selector de Color (Visual) */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Color: <span className="text-gray-500">Titanium Gray</span></h3>
            <div className="flex gap-3">
              <button className="w-8 h-8 rounded-full bg-gray-500 border-2 border-white ring-2 ring-gray-300"></button>
              <button className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white ring-2 ring-transparent hover:ring-gray-300"></button>
              <button className="w-8 h-8 rounded-full bg-[#E3D0BA] border-2 border-white ring-2 ring-transparent hover:ring-gray-300"></button>
            </div>
          </div>

          {/* Selector Cantidad y Botones */}
          <div className="flex flex-col gap-4 mb-8">
             <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                   <button 
                     onClick={() => setQuantity(Math.max(1, quantity - 1))}
                     className="px-4 py-2 hover:bg-gray-100 text-xl font-medium"
                   >-</button>
                   <span className="w-12 text-center font-bold">{quantity}</span>
                   <button 
                     onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                     className="px-4 py-2 hover:bg-gray-100 text-xl font-medium"
                   >+</button>
                </div>
                <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                   {product.stock} unidades disponibles
                </span>
             </div>

             {/* === BOTONES CONECTADOS === */}
             <div className="flex gap-4 mt-2">
                <button 
                    onClick={() => handleAddToCart(true)}
                    disabled={product.stock <= 0 || adding}
                    className="flex-1 bg-[#FCD34D] hover:bg-[#FBBF24] text-black font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   <CreditCard className="w-5 h-5" />
                   {adding ? 'Procesando...' : 'Compra ahora'}
                </button>
                <button 
                    onClick={() => handleAddToCart(false)}
                    disabled={product.stock <= 0 || adding}
                    className="flex-1 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   <ShoppingCart className="w-5 h-5" />
                   {adding ? '...' : 'Añadir al carrito'}
                </button>
             </div>
          </div>

          {/* Descripción */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-bold mb-4">Descripción:</h3>
            <div className="text-gray-600 space-y-2 text-sm leading-relaxed whitespace-pre-line">
               {product.descripcion ? product.descripcion : "Sin descripción disponible."}
            </div>
          </div>
        </div>

      </div>
      
      {/* === MODAL DE LOGIN/REGISTRO === */}
      <LoginOrRegisterModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
