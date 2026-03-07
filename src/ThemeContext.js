import React, { createContext, useContext, useState, useEffect } from 'react';

// Crear el contexto
const ThemeContext = createContext();

// Hook personalizado para usar el tema fácilmente
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme debe usarse dentro de un ThemeProvider");
    }
    return context;
};

// Proveedor del contexto
export const ThemeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem("darkMode");
        return savedMode ? JSON.parse(savedMode) : false;
    });

    const [highContrast, setHighContrast] = useState(() => {
        const saved = localStorage.getItem("highContrast");
        return saved ? JSON.parse(saved) : false;
    });

    // Sincronizar clases en el body cuando cambie algún tema
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }
        
        if (highContrast) {
            document.body.classList.add("high-contrast");
        } else {
            document.body.classList.remove("high-contrast");
        }
    }, [darkMode, highContrast]);

    // Escuchar cambios desde otras pestañas (sincronización cross-tab)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "darkMode") {
                setDarkMode(JSON.parse(e.newValue));
            }
            if (e.key === "highContrast") {
                setHighContrast(JSON.parse(e.newValue));
            }
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const toggleDarkMode = () => {
        setDarkMode((prev) => {
            const newVal = !prev;
            localStorage.setItem("darkMode", JSON.stringify(newVal));
            return newVal;
        });
    };

    const toggleHighContrast = () => {
        setHighContrast((prev) => {
            const newVal = !prev;
            localStorage.setItem("highContrast", JSON.stringify(newVal));
            return newVal;
        });
    };

    return (
        <ThemeContext.Provider value={{ darkMode, highContrast, toggleDarkMode, toggleHighContrast }}>
            {children}
        </ThemeContext.Provider>
    );
};
