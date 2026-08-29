"""
heuristic.py — Rule-Based Post-Processing untuk Koreksi Sentimen IndoBERT
=========================================================================
Menangani tiga kelas false prediction yang umum terjadi:

  Rule 1 — Netral → Positif  : komentar dukungan/ajakan/islami/emoji ramah
  Rule 2 — Negatif → Netral  : pertanyaan teknis sosmed tanpa kata komplain
  Rule 3 — Negatif → Positif : candaan/sarkasme ringan dengan indikator tawa

Fungsi utama: post_process_sentiment()
Dipanggil sekali di indo_bert.py setelah softmax per komentar.
"""

import re
from typing import Tuple


# ===========================================================================
# KONSTANTA & POLA REGEX (dikompilasi sekali saat import)
# ===========================================================================

# ---------------------------------------------------------------------------
# Rule 1 — Netral → Positif
# ---------------------------------------------------------------------------

# Emoji afeksi/positif/ramah (dicek langsung pada teks asli)
_POSITIVE_EMOJIS = frozenset([
    "😊", "🥰", "❤️", "🤍", "🖤", "💕", "💗", "💓", "💞", "💖", "💝",
    "✨", "🌟", "⭐", "🙏", "🤲", "😍", "😘", "😁", "😄", "🎉", "🎊",
    "👍", "👏", "🙌", "💪", "✅", "🫶", "🥹",
])

# Pola ajakan/harapan yang hangat & tanpa penolakan
_INVITATION_PATTERN = re.compile(
    r'\b('
    r'balik(\s*(lagi|kak|ka|dong|yuk|sini))?|'
    r'dateng(\s*(lagi|sini|dong))?|'
    r'mampir(\s*(lagi|sini|dong))?|'
    r'kesini|ke\s*sini|'
    r'kuy+|yuk+|'
    r'yu+k+(\s*(lagi|balik|dong))?|'
    r'yok(\s*(lagi|balik|dong))?|'
    r'semangat(\s*(kak|ka|ya|terus))?|'
    r'ditunggu(\s*(kak|ka|ya))?|'
    r'lanjut(\s*(kak|ka|dong|terus))?|'
    r'terus\s*(berkarya|posting|konten)|'
    r'sukses(\s*(terus|selalu|ya))?|'
    r'keep\s*(it\s*up|going|posting)'
    r')',
    flags=re.IGNORECASE
)

# Pola afeksi/ekspresi islami
_ISLAMIC_POSITIVE_PATTERN = re.compile(
    r'\b('
    r'amin+|amiin+|'
    r'alhamdulillah|'
    r'masya\s*allah|masyaallah|'
    r'barakallah|barakallahu\s*fik(um)?|'
    r'tabarakallah|subhanallah|'
    r'jazakallah|'
    r'insyaallah|insya\s*allah'
    r')',
    flags=re.IGNORECASE
)

# Kata penolakan tegas yang MEMBATALKAN Rule 1
_REJECTION_PATTERN = re.compile(
    r'\b(jangan|gak mau|ga mau|tidak mau|ogah|males|malas|gak suka|ga suka)\b',
    flags=re.IGNORECASE
)

# ---------------------------------------------------------------------------
# Rule 2 — Negatif → Netral (pertanyaan teknis sosmed)
# ---------------------------------------------------------------------------

_TECHNICAL_QUESTION_PATTERN = re.compile(
    r'\b('
    r'notif(ikasi)?(\s*(nya|mu|keluar|ngga|masuk|muncul))?|'
    r'(keluar|masuk)\s*(ngga|gak|ga|tidak)\s*(notif)?|'
    r'(tanya|nanya)(\s*(min|bang|kak|mas|mba|dong))?|'
    r'ini\s*kenapa(\s*ya)?|'
    r'kenapa(\s*(ya|sih|nih))?\s*(ini|ngga|gak)|'
    r'gimana(\s*(cara|caranya))?|'
    r'cara(\s*nya)?\s*(gimana|bagaimana)|'
    r'bisa(\s*(bantu|tolong|jelasin))?|'
    r'apakah|apa\s*iya|emang\s*(bisa|ada|iya)|'
    r'link(\s*nya)?(\s*(mana|ada|dong))?|'
    r'kapan(\s*(upload|rilis|keluar|tayang))?'
    r')',
    flags=re.IGNORECASE
)

# Kata komplain keras yang MEMBATALKAN Rule 2 (tetap Negatif)
_HARD_COMPLAINT_PATTERN = re.compile(
    r'\b('
    r'jelek|rusak|cacat|kecewa|mengecewakan|'
    r'haram(kan)?|sesat(kan)?|kafir(kan)?|murtad|'
    r'spam|scam|penipuan|bohong|palsu|'
    r'anjing|babi|tolol|goblok|idiot|bodoh|'
    r'bangsat|brengsek|keparat|bajingan|'
    r'laknat|terkutuk|celaka'
    r')',
    flags=re.IGNORECASE
)

# ---------------------------------------------------------------------------
# Rule 3 — Negatif → Positif/Netral (candaan/sarkasme dengan tawa)
# ---------------------------------------------------------------------------

_LAUGH_EMOJIS = frozenset(["😂", "🤣", "😆", "😹", "😄", "😁", "🤪", "😜"])

_LAUGH_TEXT_PATTERN = re.compile(
    r'\b(wkwk+|haha+|hehe+|hihi+|hoho+|awok+|xixi+|kekeke+|lmao|lol)\b',
    flags=re.IGNORECASE
)

_JOKE_PHRASE_PATTERN = re.compile(
    r'\b('
    r'sulit menerima|gak bisa serius|tidak bisa serius|ngakak|'
    r'lucu\s*(banget|bgt|parah|abis)|'
    r'terbayang\s*(sosok|seorang|si)|'
    r'masih\s*(aja|saja)\s*terbayang|'
    r'susah bayangin|susah membayangkan|'
    r'bikin\s*(ketawa|ngakak|ngilu)|'
    r'absurd\s*(banget|bgt)|'
    r'comedy|komedi|humor|bercanda|becanda|'
    r'kocak|receh|gokil|'
    r'(gw|aku|gue)\s*ngakak|langsung\s*ngakak|'
    r'ketawa|tergelak'
    r')',
    flags=re.IGNORECASE
)


# ===========================================================================
# FUNGSI HELPER INTERNAL
# ===========================================================================

def _has_positive_emoji(teks: str) -> bool:
    return any(ch in _POSITIVE_EMOJIS for ch in teks)

def _has_laugh_indicator(teks: str) -> int:
    """Hitung skor indikator tawa. Return int (laugh_score)."""
    score = 0
    score += sum(1 for ch in teks if ch in _LAUGH_EMOJIS) * 2
    score += len(_LAUGH_TEXT_PATTERN.findall(teks)) * 2
    score += len(_JOKE_PHRASE_PATTERN.findall(teks)) * 3
    return score


# ===========================================================================
# FUNGSI KOREKSI PER RULE (modular, bisa diuji terpisah)
# ===========================================================================

def _rule1_netral_ke_positif(
    teks: str, label: str, conf: float
) -> Tuple[str, float]:
    """Rule 1: Netral → Positif jika ada ajakan/afeksi/islami/emoji positif."""
    if label.lower() != "netral":
        return label, conf

    # Batalkan jika ada penolakan tegas
    if _REJECTION_PATTERN.search(teks):
        return label, conf

    score = 0
    if _has_positive_emoji(teks):
        score += 2
    if _INVITATION_PATTERN.search(teks):
        score += 3
    if _ISLAMIC_POSITIVE_PATTERN.search(teks):
        score += 3

    if score >= 2:
        return "Positif", 0.88
    return label, conf


def _rule2_negatif_ke_netral(
    teks: str, label: str, conf: float
) -> Tuple[str, float]:
    """Rule 2: Negatif → Netral jika komentar teknis/interaksi biasa."""
    if label.lower() != "negatif":
        return label, conf

    # Batalkan jika ada kata komplain/makian keras
    if _HARD_COMPLAINT_PATTERN.search(teks):
        return label, conf

    if _TECHNICAL_QUESTION_PATTERN.search(teks):
        return "Netral", 0.90
    return label, conf


def _rule3_negatif_candaan(
    teks: str, label: str, conf: float,
    prob_positif: float = 0.0, prob_netral: float = 0.0
) -> Tuple[str, float]:
    """Rule 3: Negatif → Positif/Netral jika candaan/sarkasme ringan."""
    if label.lower() != "negatif":
        return label, conf

    # Batalkan jika ada kata kasar keras
    if _HARD_COMPLAINT_PATTERN.search(teks):
        return label, conf

    laugh_score = _has_laugh_indicator(teks)
    if laugh_score < 2:
        return label, conf

    # Koreksi berdasarkan probabilitas residual model
    if prob_positif >= prob_netral:
        corrected_conf = max(prob_positif, 0.60) if prob_positif > 0.15 else 0.60
        return "Positif", round(corrected_conf, 4)
    else:
        corrected_conf = max(prob_netral, 0.55) if prob_netral > 0.15 else 0.55
        return "Netral", round(corrected_conf, 4)


# ===========================================================================
# FUNGSI UTAMA: post_process_sentiment
# ===========================================================================

def post_process_sentiment(
    teks_asli: str,
    label_mentah: str,
    confidence_mentah: float,
    prob_positif: float = 0.0,
    prob_netral: float = 0.0,
) -> Tuple[str, float]:
    """
    Pipeline koreksi heuristik terurut setelah inferensi IndoBERT.

    Urutan evaluasi (first-match wins):
      1. Rule 3 — Negatif candaan/sarkasme → Positif/Netral
      2. Rule 2 — Negatif teknis/interaksi → Netral
      3. Rule 1 — Netral ajakan/islami/emoji → Positif

    Parameter
    ----------
    teks_asli : str
        Teks komentar asli (pra-preprocessing, agar emoji terbaca).
    label_mentah : str
        Label prediksi model ('Positif', 'Netral', 'Negatif').
    confidence_mentah : float
        Nilai confidence label prediksi (0.0 – 1.0).
    prob_positif : float
        Probabilitas kelas Positif dari softmax.
    prob_netral : float
        Probabilitas kelas Netral dari softmax.

    Return
    ------
    Tuple[str, float]
        (label_terkoreksi, confidence_terkoreksi)
    """
    label, conf = label_mentah, confidence_mentah

    # Rule 3: Negatif (candaan) → Positif/Netral
    label, conf = _rule3_negatif_candaan(teks_asli, label, conf, prob_positif, prob_netral)
    if label != label_mentah:
        return label, conf

    # Rule 2: Negatif (teknis) → Netral
    label, conf = _rule2_negatif_ke_netral(teks_asli, label, conf)
    if label != label_mentah:
        return label, conf

    # Rule 1: Netral (ajakan/islami/emoji) → Positif
    label, conf = _rule1_netral_ke_positif(teks_asli, label, conf)

    return label, conf


# ---------------------------------------------------------------------------
# BACKWARD COMPAT: alias lama agar tidak breaking jika ada tempat lain yg import
# ---------------------------------------------------------------------------
def koreksi_sarkasme_candaan(
    teks_asli: str, label_prediksi: str, confidence: float,
    prob_positif: float = 0.0, prob_netral: float = 0.0,
) -> Tuple[str, float]:
    """Alias kompatibilitas ke post_process_sentiment (deprecated, gunakan post_process_sentiment)."""
    return post_process_sentiment(teks_asli, label_prediksi, confidence, prob_positif, prob_netral)


# ===========================================================================
# UNIT TEST — python heuristic.py
# ===========================================================================
if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    TEST_CASES = [
        # teks, label_model, conf, p_pos, p_net, expected_label, keterangan
        # ── Rule 1: Netral → Positif ─────────────────────────────────────────
        ("Balik kak 😊",                             "Netral", 0.97, 0.02, 0.97, "Positif", "R1: ajakan + emoji"),
        ("yok kak balik lagi",                       "Netral", 0.99, 0.01, 0.99, "Positif", "R1: ajakan yok+balik"),
        ("yuuk....balik lagi",                       "Netral", 0.98, 0.01, 0.98, "Positif", "R1: yuk balik"),
        ("dateng sini lagi ka 😊",                   "Netral", 0.97, 0.02, 0.97, "Positif", "R1: dateng + emoji"),
        ("Alhamdulillah mantap kontennya",            "Netral", 0.80, 0.15, 0.80, "Positif", "R1: islami alhamdulillah"),
        ("Masya Allah bagus banget ❤️",               "Netral", 0.75, 0.20, 0.75, "Positif", "R1: islami + emoji"),
        ("jangan balik lagi ya kak",                  "Netral", 0.90, 0.05, 0.90, "Netral",  "R1 dibatalkan: ada penolakan"),
        # ── Rule 2: Negatif → Netral ─────────────────────────────────────────
        ("keluar ngga notifnya bang",                 "Negatif", 0.99, 0.01, 0.00, "Netral",  "R2: pertanyaan teknis notif"),
        ("ini kenapa ya gak keluar",                  "Negatif", 0.85, 0.05, 0.10, "Netral",  "R2: kenapa+gak"),
        ("link nya mana kak",                         "Negatif", 0.70, 0.10, 0.20, "Netral",  "R2: tanya link"),
        ("kapan upload lagi",                         "Negatif", 0.65, 0.15, 0.20, "Netral",  "R2: kapan upload"),
        ("barang rusak kecewa banget",                "Negatif", 0.95, 0.02, 0.03, "Negatif", "R2 dibatalkan: kata komplain"),
        # ── Rule 3: Negatif → Positif/Netral (candaan) ───────────────────────
        ("Sulit menerima seorang brian furan serius. Masih aja terbayang sesosok funix 😂",
                                                      "Negatif", 0.72, 0.18, 0.10, "Positif", "R3: frasa+emoji tawa"),
        ("Gak bisa serius nontonnya hahaha absurd banget 🤣",
                                                      "Negatif", 0.65, 0.25, 0.10, "Positif", "R3: haha+emoji"),
        ("Ngakak parah wkwk kocak banget si doi",     "Negatif", 0.58, 0.10, 0.32, "Netral",  "R3: wkwk, p_net>p_pos"),
        ("Anjing ini jelek banget, kecewa parah",     "Negatif", 0.95, 0.02, 0.03, "Negatif", "R3 dibatalkan: kata kasar"),
        # ── Tidak ada perubahan (sudah benar) ────────────────────────────────
        ("Suka banget sama produknya, berkualitas! ❤️",
                                                      "Positif", 0.99, 0.99, 0.01, "Positif", "Positif tetap"),
    ]

    print("=" * 72)
    print("  UNIT TEST: post_process_sentiment() — 3 Rules")
    print("=" * 72)

    passed = 0
    for i, (teks, pred, conf, p_pos, p_net, expected, ket) in enumerate(TEST_CASES, 1):
        out_label, out_conf = post_process_sentiment(teks, pred, conf, p_pos, p_net)
        ok = out_label == expected
        if ok:
            passed += 1
        status = "PASS" if ok else "FAIL"
        changed = " [DIKOREKSI]" if out_label != pred else ""

        print(f"\n[{i:02d}] {status} | {ket}")
        print(f"  Teks    : {teks[:75]}")
        print(f"  Model   : {pred} ({conf:.0%})")
        print(f"  Output  : {out_label} ({out_conf:.0%}){changed}")
        print(f"  Expected: {expected}")

    print(f"\n{'=' * 72}")
    print(f"  HASIL: {passed}/{len(TEST_CASES)} test case berhasil.")
    print("=" * 72)
