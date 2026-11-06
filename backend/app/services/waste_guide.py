GUIDES = {
    "organik": {
        "title": "Sampah Organik (Sisa Makanan/Daun)",
        "steps": [
            "Pisahkan dari plastik atau kertas di sekitarnya.",
            "Jika ada sisa makanan, pastikan tidak tercampur minyak berlebih.",
            "Masukkan ke komposter, lubang biopori, atau wadah takakura.",
            "Tutup dan tunggu 2-4 minggu hingga menjadi pupuk kompos.",
        ],
        "tip": "Jangan buang sisa makanan ke TPA. Bisa jadi kompos untuk tanaman di rumah atau dibagikan ke banjar.",
    },
    "plastik": {
        "title": "Sampah Plastik & Kemasan",
        "steps": [
            "Bilas sisa makanan/minuman dari plastik hingga bersih.",
            "Keringkan plastik (jangan dalam keadaan basah).",
            "Pipihkan botol dan lipat kemasan untuk menghemat ruang.",
            "Pisahkan botol minuman (PET) dengan plastik kemasan (kresek/sachet).",
            "Serahkan ke bank sampah atau pengepul terdekat.",
        ],
        "tip": "Botol air mineral memiliki harga jual lebih tinggi di bank sampah dibanding plastik kresek.",
    },
    "kertas": {
        "title": "Sampah Kertas & Kardus",
        "steps": [
            "Pastikan kertas dalam kondisi kering (tidak terkena air/oli).",
            "Lipat atau ikat kardus agar rapi.",
            "Pisahkan kertas putih (HVS) dengan kertas koran/kardus.",
            "Serahkan ke bank sampah atau tempat daur ulang.",
        ],
        "tip": "Kertas yang basah atau berminyak (seperti kertas nasi) masuk kategori organik, bukan kertas.",
    },
    "logam": {
        "title": "Sampah Logam & Kaleng",
        "steps": [
            "Bilas kaleng bekas minuman atau makanan.",
            "Keringkan dan pipihkan kaleng aluminium.",
            "Pisahkan dari besi berkarat (jika ada).",
            "Jual ke pengepul logam atau bank sampah.",
        ],
        "tip": "Logam memiliki nilai jual paling stabil dan bisa didaur ulang tanpa batas.",
    },
    "berbahaya": {
        "title": "Sampah Berbahaya (B3)",
        "steps": [
            "JANGAN dicampur dengan sampah rumah tangga lain.",
            "Simpan di wadah tertutup, jauh dari jangkauan anak-anak.",
            "Kumpulkan baterai bekas, lampu, dan obat kadaluarsa secara terpisah.",
            "Serahkan ke titik pengumpulan B3 di kecamatan atau Dinas Lingkungan Hidup (DLH).",
        ],
        "tip": "Baterai dan lampu bekas mengandung merkuri yang berbahaya jika masuk ke TPA biasa.",
    },
    "lainnya": {
        "title": "Sampah Residu (Kaca, Kain, Karet)",
        "steps": [
            "Bungkus kaca yang pecah dengan kertas tebal atau kardus agar aman.",
            "Pisahkan kain yang masih layak pakai untuk didonasikan.",
            "Jika sudah tidak bisa didaur ulang, buang ke tempat sampah residu (abu-abu).",
        ],
        "tip": "Kurangi pemakaian barang sekali pakai untuk meminimalkan sampah residu.",
    },
}

def get_guide(label: str) -> dict:
    return GUIDES.get(label, GUIDES["lainnya"])