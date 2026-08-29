import re
import emoji
from app.utils.slang_dict import SLANG_WORDS
from app.utils.stopwords_id import INDONESIAN_STOPWORDS


# ---------------------------------------------------------------------------
# Pola normalisasi kata berimbuhan yang terpisah spasi (salah ketik / typo)
# Format: (pattern_regex, replacement_string)
# Dibuat secara modular agar mudah diperluas ke depannya.
# ---------------------------------------------------------------------------
_AFFIXED_WORD_PATTERNS = [
    # ── Prefix "di" + kata + suffix "kan" ──────────────────────────────────
    (r'\bdi\s+(haram)\s*(kan)\b',       r'di\1\2'),       # di haramkan   -> diharamkan
    (r'\bdi\s+(sesatkan)\b',            r'di\1'),          # di sesatkan   -> disesatkan
    (r'\bdi\s+(rusakkan)\b',            r'di\1'),          # di rusakkan   -> dirusakkan
    (r'\bdi\s+(hakimi)\b',              r'di\1'),          # di hakimi     -> dihakimi
    (r'\bdi\s+(kafirkan)\b',            r'di\1'),          # di kafirkan   -> dikafirkan
    (r'\bdi\s+(bidahkan)\b',            r'di\1'),          # di bidahkan   -> dibidahkan
    (r'\bdi\s+(zindikkan)\b',           r'di\1'),          # di zindikkan  -> dizindikkan
    (r'\bdi\s+(larang)\b',              r'di\1'),          # di larang     -> dilarang
    (r'\bdi\s+(larang\s*kan)\b',        r'dilarangkan'),   # di larang kan -> dilarangkan

    # ── Prefix "meng" + kata + suffix "kan" ────────────────────────────────
    (r'\bmeng\s+(kafir)\s*(kan)\b',     r'meng\1\2'),      # meng kafirkan  -> mengkafirkan
    (r'\bmeng\s+(haram)\s*(kan)\b',     r'meng\1\2'),      # meng haramkan  -> mengharamkan
    (r'\bmeng\s+(sesatkan)\b',          r'meng\1'),        # meng sesatkan  -> mengesatkan
    (r'\bmeng\s+(hakimi)\b',            r'meng\1'),        # meng hakimi    -> menghakimi

    # ── Prefix "me" + kata + suffix "kan" ─────────────────────────────────
    (r'\bme\s+(rusak)\s*(kan)\b',       r'me\1\2'),        # me rusakkan   -> merusakkan
    (r'\bme\s+(nangis)\b',              r'me\1'),          # me nangis     -> menangis
    (r'\bme\s+(nyesal)\b',              r'me\1'),          # me nyesal     -> menyesal

    # ── Suffix "kan" terpisah dari kata kerja umum ─────────────────────────
    (r'\b(hancur|rusak|hilang|tolak|halangi|buat|jatuh)\s*kan\b', r'\1kan'),

    # ── Prefix "ter" terpisah ──────────────────────────────────────────────
    (r'\bter\s+(sesat)\b',              r'ter\1'),         # ter sesat     -> tersesat
    (r'\bter\s+(kafirkan)\b',           r'ter\1'),         # ter kafirkan  -> terkafirkan
    (r'\bter\s+(larang)\b',             r'ter\1'),         # ter larang    -> terlarang

    # ── Prefix "ber" terpisah ──────────────────────────────────────────────
    (r'\bber\s+(dosa)\b',               r'ber\1'),         # ber dosa      -> berdosa
    (r'\bber\s+(iman)\b',               r'ber\1'),         # ber iman      -> beriman
    (r'\bber\s+(salah)\b',              r'ber\1'),         # ber salah     -> bersalah
    (r'\bber\s+(bidah)\b',              r'ber\1'),         # ber bidah     -> berbidah

    # ── Pola umum: prefix + kata polos yang sudah diketahui terpisah ───────
    (r'\b(mengharamkan|mengharam)\s*kan\b', r'mengharamkan'),
    (r'\b(mengesatkan|menyesatkan)\s*kan\b', r'menyesatkan'),
]

# Kompilasi regex sekali waktu (agar efisien saat dipanggil berulang kali)
_COMPILED_AFFIXED_PATTERNS = [
    (re.compile(p, flags=re.IGNORECASE), r) for p, r in _AFFIXED_WORD_PATTERNS
]

# Pola metadata Instagram: "4w", "15 likesReply", "3dReply", "Lihat terjemahan" dsb.
_IG_METADATA_PATTERN = re.compile(
    r'\b\d+[wdhms]\b'                   # "4w", "15h", "3d", "30m"
    r'|\d+\s*likes?\b'                  # "15 likes", "1like"
    r'|\b(reply|replies|lihat\s+terjemahan|more\s+replies|balas)\b'
    r'|\b(verified)\b',
    flags=re.IGNORECASE
)


class TextPreprocessor:
    def __init__(self):
        self.slang_dict = SLANG_WORDS
        self.stopwords = INDONESIAN_STOPWORDS

        # Precompile regexes untuk performa optimal
        self.url_pattern       = re.compile(r'https?://\S+|www\.\S+')
        self.html_pattern      = re.compile(r'<.*?>')
        self.mention_pattern   = re.compile(r'@\w+')
        self.hashtag_pattern   = re.compile(r'#\w+')
        self.elongated_pattern = re.compile(r'(.)\1{2,}')     # nangiiisss -> nangiis
        self.non_alpha_pattern = re.compile(r'[^a-zA-Z0-9\s]')
        self.whitespace_pattern= re.compile(r'\s+')

    # ── 1. Normalisasi Istilah / Kata Berimbuhan ─────────────────────────────
    def normalisasi_istilah(self, teks: str) -> str:
        """
        Menyatukan kata berimbuhan Indonesia yang sengaja/tidak sengaja
        dipisah spasi oleh pengguna media sosial.

        Contoh:
          'di haramkan'    -> 'diharamkan'
          'meng kafir kan' -> 'mengkafirkan'
          'ter sesat'      -> 'tersesat'
          'ber iman'       -> 'beriman'

        Parameter
        ---------
        teks : str
            Teks mentah sebelum tokenisasi.

        Return
        ------
        str
            Teks dengan imbuhan yang sudah disatukan kembali.
        """
        for pattern, replacement in _COMPILED_AFFIXED_PATTERNS:
            teks = pattern.sub(replacement, teks)
        return teks

    # ── 2. Bersihkan Metadata Khas Instagram ────────────────────────────────
    def _remove_ig_metadata(self, text: str) -> str:
        """
        Hapus artefak metadata Instagram seperti:
          - Stempel waktu: "4w", "15h", "3d"
          - Label interaksi: "15 likes", "Reply", "Lihat terjemahan"
        """
        return _IG_METADATA_PATTERN.sub(' ', text)

    # ── 3. Pipeline Utama clean_text ─────────────────────────────────────────
    def clean_text(self, text: str, normalize_slang: bool = True) -> str:
        """
        Pipeline lengkap pembersihan teks komentar media sosial:

        1. Konversi emoji ke teks
        2. Hapus metadata Instagram (timestamp, likes, reply label)
        3. Case folding
        4. Hapus URL & tag HTML
        5. Hapus mention (@user) & hashtag (#tag)
        6. Normalisasi kata berimbuhan yang terpisah spasi
        7. Reduksi karakter repetitif berlebih
        8. Hapus karakter non-alfanumerik
        9. Normalisasi kata slang/informal
        10. Strip & rapikan spasi
        """
        if not text or not isinstance(text, str):
            return ""

        # 1. Konversi emoji → deskripsi teks
        text = emoji.demojize(text, delimiters=(" ", " "))

        # 2. Hapus metadata Instagram
        text = self._remove_ig_metadata(text)

        # 3. Case folding
        text = text.lower()

        # 4. Hapus URL & HTML
        text = self.url_pattern.sub(' ', text)
        text = self.html_pattern.sub(' ', text)

        # 5. Hapus mention & hashtag
        text = self.mention_pattern.sub(' ', text)
        text = self.hashtag_pattern.sub(' ', text)

        # 6. Normalisasi kata berimbuhan terpisah (SEBELUM karakter non-alpha dihapus)
        text = self.normalisasi_istilah(text)

        # 7. Reduksi karakter repetitif: nangiiisss → nangiis, mantappppp → mantapp
        text = self.elongated_pattern.sub(r'\1\1', text)

        # 8. Hapus karakter non-alfanumerik
        text = self.non_alpha_pattern.sub(' ', text)

        # 9. Normalisasi slang / singkatan informal
        tokens = text.split()
        if normalize_slang:
            tokens = [self.slang_dict.get(t, t) for t in tokens]
        text = " ".join(tokens)

        # 10. Bersihkan spasi berlebih
        text = self.whitespace_pattern.sub(' ', text).strip()
        return text

    # ── 4. Ekstraksi Keyword ─────────────────────────────────────────────────
    def extract_keywords(self, texts: list[str], top_n: int = 30) -> list[dict]:
        """Ekstrak top kata frekuensi tertinggi (exclude stopword & angka)"""
        freq_map: dict[str, int] = {}
        for t in texts:
            cleaned = self.clean_text(t, normalize_slang=True)
            for w in cleaned.split():
                if len(w) > 2 and w not in self.stopwords and not w.isnumeric():
                    freq_map[w] = freq_map.get(w, 0) + 1

        sorted_words = sorted(freq_map.items(), key=lambda x: x[1], reverse=True)
        return [{"word": word, "count": count} for word, count in sorted_words[:top_n]]


preprocessor = TextPreprocessor()


# ===========================================================================
# UNIT TEST — jalankan langsung: python preprocessor.py
# ===========================================================================
if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    p = TextPreprocessor()

    TEST_CASES = [
        # (input, keterangan)
        ("video ini men gharamkan orang lain!!",        "meng + haram + kan terpisah"),
        ("jangan di haramkan sesuatu yang tidak haram", "di + haramkan terpisah"),
        ("di haram kan itu salah besar",                "di + haram + kan terpisah 2 spasi"),
        ("perilaku ini me rusak kan generasi",          "me + rusak + kan terpisah"),
        ("meng kafir kan sesama muslim itu dosa",       "meng + kafir + kan terpisah"),
        ("hidupnya ter sesat karena salah pergaulan",   "ter + sesat terpisah"),
        ("ber iman itu kewajiban setiap muslim",        "ber + iman terpisah"),
        ("nangiiisss banget nontonnya T_T 😭",          "karakter repetitif + emoji"),
        ("4w15 likesReply @daily_sirah ini bagus bgt",  "metadata IG + mention + slang"),
        ("https://bit.ly/xyz cek link ini guys!!!",     "URL + karakter berlebih"),
        ("Di Larang Keras merusak kan lingkungan ini",  "mixed case + rusakkan"),
    ]

    print("=" * 70)
    print("  UNIT TEST: TextPreprocessor — normalisasi_istilah & clean_text")
    print("=" * 70)

    for idx, (raw, keterangan) in enumerate(TEST_CASES, 1):
        normed_istilah = p.normalisasi_istilah(raw)
        cleaned = p.clean_text(raw, normalize_slang=False)
        print(f"\n[{idx}] {keterangan}")
        print(f"  INPUT   : {raw}")
        print(f"  NORMED  : {normed_istilah}")
        print(f"  CLEANED : {cleaned}")

    print("\n" + "=" * 70)
    print("  Semua test case selesai dieksekusi.")
    print("=" * 70)
