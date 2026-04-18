import { PegawaiEditForm } from "@/components/pegawai-edit-form";

export default function PegawaiNewPage() {
  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Tambah Pegawai</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Isi data pegawai baru</p>
      </div>

      <PegawaiEditForm
        pegawai={{
          id: "",
          nip: "",
          namaLengkap: "",
          jabatan: "",
          username: "",
          noHp: "",
          alamat: "",
          skRiwayat: [],
          kinerja: null,
        }}
        isNew
      />
    </div>
  );
}
