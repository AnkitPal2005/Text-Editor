import React,{createContext,useEffect,useState} from "react";
import { use } from "react";
import { Children } from "react";
export const ThemeContext=createContext();
export const  ThemeProvider=({Children})=>{
    const[theme,setTheme]=useState("light");
    useEffect(()=>{
        const savedTheme=localStorage.getItem("theme");
        if(savedTheme) setTheme(savedTheme);
    },[]);
    useEffect(()=>{
        document.body.className=theme;
        localStorage.setItem("theme",theme);
    },[theme]);
    const toggleTheme=()=>{
        setTheme(theme==="light"?"dark":"light");
    }
    return(
        <ThemeContext.Provider value={{theme,toggleTheme}}>
            {children}
        </ThemeContext.Provider>
    )
}