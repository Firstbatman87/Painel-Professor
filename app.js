const URL = "https://script.google.com/macros/s/AKfycbz67gWcN6pohsKnmq2boyY891DZq3BMLF3R_Zgtf1LDET_cu60HKXg9HbLrVha75YvMdg/exec";

let dados = [];

// ================= ELEMENTOS =================
const tituloEl = document.getElementById("titulo");
const descricaoEl = document.getElementById("descricao");
const fotoEl = document.getElementById("foto");
const professorEl = document.getElementById("professor");
const categoriaEl = document.getElementById("categoria");
const turmaEl = document.getElementById("turma");
const disciplinaEl = document.getElementById("disciplina");

// ================= THEME =================
function toggleTheme() {
    document.body.classList.toggle("dark");
    localStorage.setItem(
        "theme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );
}

(function () {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
    }
})();

// ================= SEGURANÇA =================
function escapeHTML(str = "") {
    return str.replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[m]);
}

// ================= UTIL =================
function setStatus(msg) {
    document.getElementById("status").innerText = msg;
}

function preview() {
    const url = fotoEl.value.trim();
    const img = document.getElementById("preview");

    if (url) {
        img.src = url;
        img.style.display = "block";
    } else {
        img.style.display = "none";
    }
}

// ================= API =================
async function api(body) {
    const form = new FormData();
    Object.keys(body).forEach(k => form.append(k, body[k]));

    const res = await fetch(URL, {
        method: "POST",
        body: form
    });

    if (!res.ok) throw new Error("Erro HTTP " + res.status);

    const j = await res.json();
    if (j.status !== "success") throw new Error(j.message);

    return j.data;
}

// ================= VALIDAÇÃO =================
function validarData(texto) {
    if (!texto) return true;
    return /^\d{2}\/\d{2}\/\d{4}$/.test(texto);
}

// ================= CREATE =================
async function criar() {
    try {
        setStatus("Enviando...");

        const t = tituloEl.value.trim();
        const d = descricaoEl.value.trim();
        const p = professorEl.value.trim();

        if (!t || !d || !p) {
            throw new Error("Preencha os campos obrigatórios");
        }

        const entrega = prompt("Data de entrega (dd/mm/aaaa):");

        if (entrega && !validarData(entrega)) {
            throw new Error("Data inválida (use dd/mm/aaaa)");
        }

        await api({
            action: "create",
            titulo: t,
            descricao: d,
            foto: fotoEl.value.trim(),
            categoria: categoriaEl.value,
            turma: turmaEl.value,
            professor: p,
            disciplina: disciplinaEl.value,
            dataEntrega: entrega || ""
        });

        setStatus("✅ Criado com sucesso");

        tituloEl.value = "";
        descricaoEl.value = "";
        fotoEl.value = "";
        professorEl.value = "";
        preview();

        carregar();

    } catch (e) {
        setStatus("❌ " + e.message);
    }
}

// ================= LOAD =================
async function carregar() {
    try {
        const res = await fetch(URL);
        if (!res.ok) throw new Error("Erro HTTP");

        const j = await res.json();
        if (j.status !== "success") throw new Error(j.message);

        // ✔ evita bug do reverse
        dados = [...j.data].reverse();

        const lista = document.getElementById("lista");
        lista.innerHTML = "";

        dados.forEach(p => {
            const div = document.createElement("div");

            div.innerHTML = `
                <hr>
                <b>${escapeHTML(p.titulo)}</b><br>
                ${escapeHTML(p.professor)} - ${escapeHTML(p.disciplina)}<br>

                ${p.dataEntrega
                    ? `📅 Entrega: ${escapeHTML(p.dataEntrega)}<br>`
                    : `<span style="color:gray">Sem data de entrega</span><br>`}

                ${p.foto
                    ? `<img src="${p.foto}" onerror="this.style.display='none'">`
                    : ""}

                <br>
                <button onclick="editar('${p.id}')">Editar</button>
                <button onclick="deletar('${p.id}')">Excluir</button>
            `;

            lista.appendChild(div);
        });

    } catch (e) {
        setStatus("❌ Erro ao carregar");
        console.error(e);
    }
}

// ================= DELETE =================
async function deletar(id) {
    if (!confirm("Excluir?")) return;

    try {
        await api({ action: "delete", id });
        carregar();
    } catch (e) {
        alert(e.message);
    }
}

// ================= EDIT =================
async function editar(id) {
    const post = dados.find(p => p.id === id);
    if (!post) return;

    const t = prompt("Novo título:", post.titulo);
    if (t === null) return;

    const d = prompt("Nova descrição:", post.descricao);
    if (d === null) return;

    const f = prompt("Nova URL da imagem:", post.foto || "");
    if (f === null) return;

    const entrega = prompt("Nova data (dd/mm/aaaa):", post.dataEntrega || "");

    if (entrega && !validarData(entrega)) {
        alert("Data inválida");
        return;
    }

    if (!t.trim() || !d.trim()) {
        alert("Título e descrição são obrigatórios");
        return;
    }

    try {
        await api({
            action: "edit",
            id,
            titulo: t.trim(),
            descricao: d.trim(),
            foto: f.trim(),
            dataEntrega: entrega || ""
        });

        carregar();

    } catch (e) {
        alert(e.message);
    }
}

// INIT
carregar();