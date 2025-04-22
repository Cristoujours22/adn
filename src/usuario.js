import React from "react";
import logo from "./Assets/ADN.png";
import img from "./Assets/FotoPerfil.jpeg";
import estilos from "./App.module.css";

function Usuario() {
  return (
    <div>
      <header className={estilos.header1}>
        <div className={estilos.logo}>
          <img className={estilos.ADN1} src={logo} alt="logo programa" />
        </div>
      </header>

      <nav className={estilos.nav1}></nav>

      <main className={estilos.main1}>
        <section className={estilos.section2}>
          <div className={estilos.ContenedorFoto}>
            <img
              className={estilos.FotoPerfil}
              src={img}
              alt="Foto de perfil"
            />
            <div className={estilos.ContenedorInformacion}>
              <ul>
                <h1 className={estilos.Textoh1}>Nombre</h1>
              </ul>
              <ul>
                <p className={estilos.Textop}>Nombre usuario</p>
              </ul>
              <ul>
                <h1 className={estilos.Textoh1}>Cargo </h1>
              </ul>
              <ul>
                <p className={estilos.Textop}>Cargo usuario</p>
              </ul>
              <ul>
                <h1 className={estilos.Textoh1}>Fecha de creación</h1>
              </ul>
              <ul>
                <p className={estilos.Textop}>12/04/2024</p>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Usuario;
