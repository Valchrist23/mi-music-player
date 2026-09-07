const audio =
document.getElementById("audio");

/* =========================
 E *LEMENTS
 ========================= */

const modal =
document.getElementById("m3uModal");

const openListButton =
document.getElementById("openListButton");

const welcomeLoadButton =
document.getElementById("welcomeLoadButton");

const changeListButton =
document.getElementById("changeListButton");

const closeModalButton =
document.getElementById("closeModalButton");

const loadUrlButton =
document.getElementById("loadUrlButton");

const loadFileButton =
document.getElementById("loadFileButton");

const m3uFile =
document.getElementById("m3uFile");

const m3uUrl =
document.getElementById("m3uUrl");

const loadingMessage =
document.getElementById("loadingMessage");

const errorMessage =
document.getElementById("errorMessage");

const searchInput =
document.getElementById("searchInput");

const welcome =
document.getElementById("welcome");

const library =
document.getElementById("library");

const songsContainer =
document.getElementById("songsContainer");

const noResults =
document.getElementById("noResults");

const songCount =
document.getElementById("songCount");

const playButton =
document.getElementById("playButton");

const previousButton =
document.getElementById("previousButton");

const nextButton =
document.getElementById("nextButton");

const currentTitle =
document.getElementById("currentTitle");

const currentArtist =
document.getElementById("currentArtist");

const currentTime =
document.getElementById("currentTime");

const duration =
document.getElementById("duration");

const progress =
document.getElementById("progress");

const volume =
document.getElementById("volume");

const favoriteButton =
document.getElementById("favoriteButton"); 

const allMusicButton =
document.getElementById("allMusicButton");

const favoritesListButton =
document.getElementById("favoritesListButton");

const libraryTitle =
document.getElementById("libraryTitle");

/* =========================
 S *TATE
 ========================= */

let songs = [];

let filteredSongs = [];

let currentIndex = -1;

let showingFavorites = false;

let favorites =
JSON.parse(
    localStorage.getItem(
        "musicFavorites"
    ) || "[]"
);

/* =========================
 M *ODAL
 ========================= */

function openModal() {

    modal.classList.remove("hidden");

    errorMessage.classList.add("hidden");

    loadingMessage.classList.add("hidden");

}

function closeModal() {

    modal.classList.add("hidden");

}

openListButton.addEventListener(
    "click",
    openModal
);

welcomeLoadButton.addEventListener(
    "click",
    openModal
);

changeListButton.addEventListener(
    "click",
    openModal
);

closeModalButton.addEventListener(
    "click",
    closeModal
);

/* =========================
 F *ILE LOADING
 ========================= */

loadFileButton.addEventListener(
    "click",
    () => {

        m3uFile.click();

    }

);

m3uFile.addEventListener(
    "change",
    async event => {

        const file =
        event.target.files[0];

        if (!file) return;

        try {

            showLoading();

            const text =
            await file.text();

            processM3U(text);

            hideLoading();

            closeModal();

        } catch (error) {

            showError(
                "No se pudo leer el archivo M3U."
            );

            console.error(error);

        }

    }

);

/* =========================
 U *RL LOADING
 ========================= */

const DEFAULT_M3U_URL =
    "https://raw.githubusercontent.com/Valchrist23/VikTV/master/justdrive.m3u";

loadUrlButton.addEventListener(
    "click",
    loadM3UFromURL
);

m3uUrl.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            loadM3UFromURL();

        }

    }

);

async function loadM3UFromURL() {

    const url =
    m3uUrl.value.trim();

    if (!url) {

        showError(
            "Introduce una URL M3U."
        );

        return;
    }

    try {

        new URL(url);

    } catch {

        showError(
            "La URL no parece válida."
        );

        return;

    }

    try {

        showLoading();

        const response =
        await fetch(url, {
            method: "GET"
        });

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const text =
        await response.text();

        if (!text.trim()) {

            throw new Error(
                "La lista está vacía."
            );

        }

        processM3U(text);

        hideLoading();

        closeModal();

        /*
         *       Guardamos la última URL utilizada
         *       para poder recuperarla fácilmente.
         */

        localStorage.setItem(
            "lastM3UUrl",
            url
        );

    } catch (error) {

        console.error(error);

        hideLoading();

        if (
            error instanceof TypeError
        ) {

            showError(
                "El navegador no pudo acceder a esta URL. " +
                "Es posible que el servidor no permita CORS."
            );

        } else {

            showError(
                "No se pudo cargar la lista: " +
                error.message
            );

        }

    }

}

/* =========================
 P *ROCESS M3U
 ========================= */

function processM3U(text) {

    const parsed =
    parseM3U(text);

    if (parsed.length === 0) {

        throw new Error(
            "No se encontraron canciones."
        );

    }

    songs = parsed;

    filteredSongs =
    [...songs];

    searchInput.value = "";

    welcome.classList.add(
        "hidden"
    );

    library.classList.remove(
        "hidden"
    );

    renderSongs();

}

/* =========================
 M *3U PARSER
 ========================= */

function parseM3U(text) {

    const lines =
    text
    .split(/\r?\n/)
    .map(line => line.trim());

    const result = [];

    let metadata = null;

    for (const line of lines) {

        if (!line) continue;

        /*
         * #EXTINF:-1 tvg-logo="https://ejemplo.com/album.jpg",AC/DC - Back in Black
         */

        if (line.startsWith("#EXTINF:")) {

            const comma =
            line.indexOf(",");

            let info = "";

            if (comma !== -1) {

                info =
                line
                .substring(comma + 1)
                .trim();

            }

            // Obtener tvg-logo
            const logoMatch =
            line.match(
                /tvg-logo=["']([^"']+)["']/i
            );

            const logo =
            logoMatch
            ? logoMatch[1]
            : "";

            metadata =
            parseMetadata(info);

            metadata.logo = logo;

        }

        /*
         * URL de audio
         */

        else if (
            !line.startsWith("#") &&
            (
                line.startsWith("http://") ||
                line.startsWith("https://")
            )
        ) {

            const song =
            metadata || {};

            result.push({

                title:
                song.title ||
                getFilename(line),

                artist:
                song.artist ||
                "Artista desconocido",

                album:
                song.album || "",

                logo:
                song.logo || "",

                url:
                line

            });

            metadata = null;

        }

    }

    return result;

}

/* =========================
 M *ETADATA PARSER
 ========================= */

function parseMetadata(info) {

    let artist = "";

    let title = info;

    /*
     *   Artist - Title
     */

    const separator =
    info.indexOf(
        " - "
    );

    if (separator !== -1) {

        artist =
        info
        .substring(
            0,
            separator
        )
        .trim();

        title =
        info
        .substring(
            separator + 3
        )
        .trim();

    }

    return {

        artist,

        title

    };

}

/* =========================
 F *ILENAME
 ========================= */

function getFilename(url) {

    try {

        const cleanURL =
        url.split("?")[0];

        const filename =
        decodeURIComponent(
            cleanURL.substring(
                cleanURL.lastIndexOf("/") + 1
            )
        );

        return (
            filename ||
            "Canción desconocida"
        );

    } catch {

        return "Canción desconocida";

    }

}

/* =========================
 R *ENDER SONGS
 ========================= */

function renderSongs() {

    songsContainer.innerHTML = "";

    let songsToRender;

    if (showingFavorites) {

    songsToRender =
        songs.filter(
            song => isFavorite(song)
        );

} else {

    songsToRender =
        filteredSongs;

}

    songCount.textContent =
        `${songsToRender.length} ${
            songsToRender.length === 1
            ? "canción"
            : "canciones"
        }`;

    if (
        songsToRender.length === 0
    ) {

        noResults.classList.remove(
            "hidden"
        );

        return;

    }

    noResults.classList.add(
        "hidden"
    );

    songsToRender.forEach(
        (song, index) => {

            const originalIndex =
                songs.indexOf(song);

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "song";

            const number =
                document.createElement(
                    "div"
                );

            number.className =
                "song-number";

            number.textContent =
                index + 1;

            const main =
                document.createElement(
                    "div"
                );

            main.className =
                "song-main";

            const cover =
                document.createElement(
                    "div"
                );

            cover.className =
                "song-cover";

            if (song.logo) {

                const img =
                    document.createElement(
                        "img"
                    );

                img.src =
                    song.logo;

                img.alt =
                    song.title || "Portada";

                img.loading =
                    "lazy";

                img.onerror = () => {

                    img.remove();

                    cover.textContent =
                        "♫";

                };

                cover.appendChild(
                    img
                );

            } else {

                cover.textContent =
                    "♫";

            }

            const info =
                document.createElement(
                    "div"
                );

            const title =
                document.createElement(
                    "div"
                );

            title.className =
                "song-title";

            title.textContent =
                song.title;

            const artist =
                document.createElement(
                    "div"
                );

            artist.className =
                "song-artist";

            artist.textContent =
                song.artist;

            info.appendChild(
                title
            );

            info.appendChild(
                artist
            );

            main.appendChild(
                cover
            );

            main.appendChild(
                info
            );

            const type =
                document.createElement(
                    "div"
                );

            type.className =
                "song-type";

            type.textContent =
                getFileType(
                    song.url
                );

            const play =
                document.createElement(
                    "button"
                );

            play.className =
                "song-play";

            play.textContent =
                "▶";

            play.addEventListener(
                "click",
                () => {

                    playSong(
                        originalIndex
                    );

                }
            );

            row.appendChild(
                number
            );

            row.appendChild(
                main
            );

            row.appendChild(
                type
            );

            row.appendChild(
                play
            );

            row.addEventListener(
                "dblclick",
                () => {

                    playSong(
                        originalIndex
                    );

                }
            );

            songsContainer.appendChild(
                row
            );

        }
    );

}

/* =========================
   MUSIC / FAVORITES
========================= */

allMusicButton.addEventListener(
    "click",
    () => {

        showingFavorites = false;

        libraryTitle.textContent =
            "Tu música";

        allMusicButton.classList.add(
            "active-tab"
        );

        favoritesListButton.classList.remove(
            "active-tab"
        );

        renderSongs();

    }
);

favoritesListButton.addEventListener(
    "click",
    () => {

        showingFavorites = true;

        libraryTitle.textContent =
            "Mis favoritos";

        favoritesListButton.classList.add(
            "active-tab"
        );

        allMusicButton.classList.remove(
            "active-tab"
        );

        renderSongs();

    }
);

/* =========================
 P *LAY SONG
 ========================= */

function playSong(index) {

    if (!songs[index]) return;

    currentIndex =
    index;

    const song =
    songs[index];

    audio.src =
    song.url;

    currentTitle.textContent =
    song.title;

    currentArtist.textContent =
    song.artist;

    updateFavoriteButton();

    audio.play()
    .then(() => {

        playButton.textContent =
        "⏸";

    })
    .catch(error => {

        console.error(
            error
        );

        alert(
            "No se pudo reproducir esta canción."
        );

    });

}

playButton.addEventListener(
    "click",
    () => {

        if (!audio.src) return;

        if (audio.paused) {

            audio.play();

            playButton.textContent =
            "⏸";

        } else {

            audio.pause();

            playButton.textContent =
            "▶";

        }

    }

);

/* =========================
 N *EXT / PREVIOUS
 ========================= */

previousButton.addEventListener(
    "click",
    () => {

        if (currentIndex === -1)
            return;

        let playlist;

        if (showingFavorites) {

            playlist =
                songs.filter(
                    song => isFavorite(song)
                );

        } else {

            playlist =
                songs;

        }

        const currentSong =
            songs[currentIndex];

        const position =
            playlist.indexOf(currentSong);

        if (position > 0) {

            playSong(
                songs.indexOf(
                    playlist[position - 1]
                )
            );

        }

    }
);

nextButton.addEventListener(
    "click",
    () => {

        if (currentIndex === -1)
            return;

        let playlist;

        if (showingFavorites) {

            playlist =
                songs.filter(
                    song => isFavorite(song)
                );

        } else {

            playlist =
                songs;

        }

        const currentSong =
            songs[currentIndex];

        const position =
            playlist.indexOf(currentSong);

        if (
            position !== -1 &&
            position < playlist.length - 1
        ) {

            playSong(
                songs.indexOf(
                    playlist[position + 1]
                )
            );

        }

    }
);

audio.addEventListener(
    "ended",
    () => {

        if (currentIndex === -1)
            return;

        let playlist;

        if (showingFavorites) {

            playlist =
                songs.filter(
                    song => isFavorite(song)
                );

        } else {

            playlist =
                songs;

        }

        const currentSong =
            songs[currentIndex];

        const position =
            playlist.indexOf(currentSong);

        if (
            position !== -1 &&
            position < playlist.length - 1
        ) {

            playSong(
                songs.indexOf(
                    playlist[position + 1]
                )
            );

        }

    }
);

/* =========================
 P *ROGRESS
 ========================= */

audio.addEventListener(
    "timeupdate",
    () => {

        if (!audio.duration)
            return;

        progress.value =
        (
            audio.currentTime /
            audio.duration
        ) * 100;

        currentTime.textContent =
        formatTime(
            audio.currentTime
        );

        duration.textContent =
        formatTime(
            audio.duration
        );

    }

);

progress.addEventListener(
    "input",
    () => {

        if (!audio.duration)
            return;

        audio.currentTime =
        (
            progress.value /
            100
        ) *
        audio.duration;

    }

);

function formatTime(seconds) {

    if (
        !Number.isFinite(seconds)
    ) {

        return "0:00";

    }

    const minutes =
    Math.floor(
        seconds / 60
    );

    const secs =
    Math.floor(
        seconds % 60
    )
    .toString()
    .padStart(2, "0");

    return `${minutes}:${secs}`;

}

/* =========================
 V *OLUME
 ========================= */

audio.volume =
Number(
    volume.value
);

volume.addEventListener(
    "input",
    () => {

        audio.volume =
        Number(
            volume.value
        );

    }

);

/* =========================
 F *AVORITES
 ========================= */

function songKey(song) {

    return song.url;

}

function isFavorite(song) {

    return favorites.includes(
        songKey(song)
    );

}

function toggleFavorite(song) {

    const key =
    songKey(song);

    if (
        favorites.includes(key)
    ) {

        favorites =
        favorites.filter(
            item =>
            item !== key
        );

    } else {

        favorites.push(key);

    }

     localStorage.setItem(
        "musicFavorites",
        JSON.stringify(
            favorites
        )
    );

    updateFavoriteButton();

    renderSongs();

}

function updateFavoriteButton() {

    if (
        currentIndex === -1 ||
        !songs[currentIndex]
    ) {

        favoriteButton.textContent =
        "♡";

    return;

    }

    const song =
    songs[currentIndex];

    if (
        isFavorite(song)
    ) {

        favoriteButton.textContent =
        "♥";

    favoriteButton.style.color =
    "#1ed760";

    } else {

        favoriteButton.textContent =
        "♡";

    favoriteButton.style.color =
    "white";

    }

}

favoriteButton.addEventListener(
    "click",
    () => {

        if (
            currentIndex === -1
        )
            return;

            toggleFavorite(
                songs[currentIndex]
            );

    }

);

/* =========================
 F *ILE TYPE
 ========================= */

function getFileType(url) {

    try {

        const pathname =
        new URL(url)
        .pathname
        .toLowerCase();

        if (
            pathname.endsWith(
                ".mp3"
            )
        )
            return "MP3";

            if (
                pathname.endsWith(
                    ".flac"
                )
            )
                return "FLAC";

                if (
                    pathname.endsWith(
                        ".ogg"
                    )
                )
                    return "OGG";

                    if (
                        pathname.endsWith(
                            ".m4a"
                        )
                    )
                        return "M4A";

                        return "Audio";

    } catch {

        return "Audio";

    }

}

/* =========================
 U *I HELPERS
 ========================= */

function showLoading() {

    loadingMessage.classList.remove(
        "hidden"
    );

    errorMessage.classList.add(
        "hidden"
    );

}

function hideLoading() {

    loadingMessage.classList.add(
        "hidden"
    );

}

function showError(message) {

    loadingMessage.classList.add(
        "hidden"
    );

    errorMessage.textContent =
    message;

    errorMessage.classList.remove(
        "hidden"
    );

}

/* =========================
   AUTO LOAD M3U
========================= */

async function loadDefaultM3U() {

    const savedUrl =
        localStorage.getItem("lastM3UUrl");

    const url =
        savedUrl || DEFAULT_M3U_URL;

    try {

        showLoading();

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const text =
            await response.text();

        if (!text.trim()) {

            throw new Error(
                "La lista está vacía."
            );

        }

        processM3U(text);

        hideLoading();

        localStorage.setItem(
            "lastM3UUrl",
            url
        );

    } catch (error) {

        console.error(
            "Error cargando lista automáticamente:",
            error
        );

        hideLoading();

        welcome.classList.remove("hidden");
        library.classList.add("hidden");

    }

}

loadDefaultM3U();
