const API_URL = "https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0";

const container = document.querySelector(".container");

let pokemones = [];

const buscador = document.getElementById("buscadorPokemon");
const botonLimpiar = document.getElementById("limpiarBusqueda");
const mensajeBusqueda = document.getElementById("mensajeBusqueda");

if (container) {
    if (buscador) {
        buscador.addEventListener("input", mostrarCatalogo);
    }

    if (botonLimpiar) {
        botonLimpiar.addEventListener("click", () => {
            buscador.value = "";
            mostrarCatalogo();
            buscador.focus();
        });
    }

    async function iniciarAplicacion() {
        container.style.display = "grid";
        container.innerHTML = "<p>Cargando Pokédex...</p>";

        try {
            const respuesta = await fetch(API_URL);

            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }

            const datos = await respuesta.json();

            pokemones = datos.results.map((pokemon) => {
                const id = Number(pokemon.url.split("/").filter(Boolean).pop());

                return {
                    id,
                    nombre: pokemon.name,
                    url: pokemon.url,
                    imagen: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
                };
            });

            mostrarCatalogo();

            const guardado = sessionStorage.getItem("pokemonSeleccionado");

            if (guardado !== null) {
                const index = pokemones.findIndex(
                    (pokemon) => pokemon.id === Number(guardado)
                );

                if (index !== -1) {
                    mostrarDetalle(index);
                }
            }
        } catch (error) {
            console.error("Error al cargar PokéAPI:", error);

            container.style.display = "block";
            container.innerHTML = `
                <div class="error-api">
                    <h2>No se pudo cargar la Pokédex</h2>
                    <p>
                        Verifica tu conexión a Internet
                        e inténtalo de nuevo.
                    </p>
                    <button id="btn-reintentar">Reintentar</button>
                </div>
            `;

            document
                .getElementById("btn-reintentar")
                .addEventListener("click", iniciarAplicacion);
        }
    }

    function capitalizar(texto) {
        return texto
            .split("-")
            .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
            .join(" ");
    }

    // Mostrar el catálogo y aplicar el filtro de búsqueda

    function mostrarCatalogo() {
        sessionStorage.removeItem("pokemonSeleccionado");

        container.style.display = "grid";
        container.innerHTML = "";

        const busqueda = buscador ? buscador.value.trim().toLowerCase() : "";

        const resultados = pokemones
            .map((pokemon, index) => ({ pokemon, index }))
            .filter(({ pokemon }) => {
                return (
                    pokemon.nombre.toLowerCase().includes(busqueda) ||
                    String(pokemon.id).includes(busqueda)
                );
            });

        if (mensajeBusqueda) {
            mensajeBusqueda.textContent = busqueda
                ? `Se encontraron ${resultados.length} Pokémon.`
                : `Pokémon disponibles: ${resultados.length}`;
        }

        if (resultados.length === 0) {
            container.style.display = "block";
            container.innerHTML = `
            <div class="sin-resultados">
                <h2>No se encontraron Pokémon</h2>
                <p>Intenta buscar con otro nombre o número.</p>
            </div>
        `;
            return;
        }

        const fragmento = document.createDocumentFragment();

        resultados.forEach(({ pokemon, index }) => {
            const card = document.createElement("article");
            card.className = "pokemon-card";

            const imagen = document.createElement("img");
            imagen.src = pokemon.imagen;
            imagen.alt = capitalizar(pokemon.nombre);
            imagen.loading = "lazy";

            imagen.onerror = () => {
                imagen.onerror = null;
                imagen.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
            };

            const titulo = document.createElement("h2");
            titulo.textContent = capitalizar(pokemon.nombre);

            const numero = document.createElement("p");
            numero.textContent = `N.º ${String(pokemon.id).padStart(3, "0")}`;

            const boton = document.createElement("button");
            boton.className = "btn-ver-mas";
            boton.textContent = "Ver más";

            boton.addEventListener("click", () => {
                mostrarDetalle(index);
            });

            card.append(imagen, titulo, numero, boton);
            fragmento.appendChild(card);
        });

        container.appendChild(fragmento);
    }

    async function mostrarDetalle(index) {
        const pokemon = pokemones[index];

        if (!pokemon) {
            mostrarCatalogo();
            return;
        }

        sessionStorage.setItem("pokemonSeleccionado", String(pokemon.id));

        // Ocultar el buscador en la vista de detalles
        buscador.parentElement.style.display = "none";
        mensajeBusqueda.style.display = "none";

        container.style.display = "block";
        container.innerHTML = "<p>Cargando detalles del Pokémon...</p>";

        try {
            const respuesta = await fetch(pokemon.url);

            if (!respuesta.ok) {
                throw new Error("No se pudieron obtener los detalles.");
            }

            const detalle = await respuesta.json();

            container.innerHTML = "";

            const card = document.createElement("div");
            card.className = "pokemon-detalle-card";

            const imagen = document.createElement("img");
            imagen.src =
                detalle.sprites.other?.["official-artwork"]?.front_default ||
                detalle.sprites.front_default ||
                pokemon.imagen;

            imagen.alt = capitalizar(pokemon.nombre);

            const titulo = document.createElement("h2");
            titulo.textContent = capitalizar(detalle.name);

            const crearParrafo = (etiqueta, valor) => {
                const p = document.createElement("p");
                const strong = document.createElement("strong");

                strong.textContent = `${etiqueta}: `;
                p.append(strong, document.createTextNode(valor));

                return p;
            };

            card.append(
                imagen,
                titulo,
                crearParrafo("Número", `#${detalle.id}`),
                crearParrafo("Tipos", detalle.types.map((t) => t.type.name).join(", ")),
                crearParrafo("Altura", `${detalle.height / 10} m`),
                crearParrafo("Peso", `${detalle.weight / 10} kg`),
                crearParrafo(
                    "Experiencia base",
                    String(detalle.base_experience ?? "No disponible")
                )
            );

            const tituloHabilidades = document.createElement("h3");
            tituloHabilidades.textContent = "Habilidades";
            card.appendChild(tituloHabilidades);

            card.appendChild(
                crearParrafo(
                    "Habilidades",
                    detalle.abilities.map((a) => a.ability.name).join(", ") ||
                    "No disponibles"
                )
            );

            const tituloEstadisticas = document.createElement("h3");
            tituloEstadisticas.textContent = "Estadísticas";
            card.appendChild(tituloEstadisticas);

            const lista = document.createElement("ul");

            detalle.stats.forEach((stat) => {
                const li = document.createElement("li");

                li.textContent = `${capitalizar(stat.stat.name)}: ${stat.base_stat}`;

                lista.appendChild(li);
            });

            card.appendChild(lista);

            const botonVolver = document.createElement("button");
            botonVolver.id = "btn-volver";
            botonVolver.textContent = "Volver al catálogo";

            botonVolver.addEventListener("click", mostrarCatalogo);

            card.appendChild(botonVolver);
            container.appendChild(card);

            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            console.error("Error al cargar detalles:", error);

            container.innerHTML = `
                <div class="error-api">
                    <h2>Error al cargar el Pokémon</h2>
                    <p>No fue posible consultar sus detalles.</p>
                    <button id="btn-volver-catalogo">
                        Volver al catálogo
                    </button>
                    <button id="btn-reintentar-detalle">
                        Reintentar
                    </button>
                </div>
            `;

            document
                .getElementById("btn-volver-catalogo")
                .addEventListener("click", mostrarCatalogo);

            document
                .getElementById("btn-reintentar-detalle")
                .addEventListener("click", () => mostrarDetalle(index));
        }
    }

    iniciarAplicacion();
}
