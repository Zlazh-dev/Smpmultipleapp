import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";

// Color config for attendance status
const STATUS_COLORS: Record<string, { font: string; fill: string }> = {
  HADIR: { font: "FF1B7D3A", fill: "FFD5F5E3" },
  IZIN: { font: "FF1A5276", fill: "FFD6EAF8" },
  SAKIT: { font: "FF7D6608", fill: "FFFDEBD0" },
  ALFA: { font: "FF922B21", fill: "FFFADBD8" },
  PENDING: { font: "FF7D6608", fill: "FFFEF9E7" },
  APPROVED: { font: "FF1B7D3A", fill: "FFD5F5E3" },
  REJECTED: { font: "FF922B21", fill: "FFFADBD8" },
};

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2C3E50" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF95A5A6" } },
      bottom: { style: "thin", color: { argb: "FF95A5A6" } },
      left: { style: "thin", color: { argb: "FFBDC3C7" } },
      right: { style: "thin", color: { argb: "FFBDC3C7" } },
    };
  });
  row.height = 28;
}

function applyDataStyle(row: ExcelJS.Row, statusColIdx?: number) {
  row.eachCell((cell, colNumber) => {
    cell.font = { size: 10 };
    cell.alignment = { vertical: "middle" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFE8E8E8" } },
      left: { style: "thin", color: { argb: "FFF0F0F0" } },
      right: { style: "thin", color: { argb: "FFF0F0F0" } },
    };

    // Color status cells
    if (statusColIdx && colNumber === statusColIdx) {
      const val = String(cell.value || "").toUpperCase();
      const color = STATUS_COLORS[val];
      if (color) {
        cell.font = { bold: true, size: 10, color: { argb: color.font } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color.fill } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    }
  });
  row.height = 22;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const tanggal = searchParams.get("tanggal");
    const bulan = searchParams.get("bulan");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TU SMPIT Asy-Syadzili";
    workbook.created = new Date();

    let filename = "export";

    if (type === "pegawai") {
      if (user.accessLevel !== "KHUSUS") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const data = await db.pegawai.findMany({ orderBy: { namaLengkap: "asc" } });

      const ws = workbook.addWorksheet("Data Pegawai");

      // Title row
      ws.mergeCells("A1:G1");
      const titleCell = ws.getCell("A1");
      titleCell.value = "DATA PEGAWAI — SMPIT ASY-SYADZILI";
      titleCell.font = { bold: true, size: 14, color: { argb: "FF2C3E50" } };
      titleCell.alignment = { horizontal: "center" };

      ws.mergeCells("A2:G2");
      ws.getCell("A2").value = `Diekspor: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
      ws.getCell("A2").font = { size: 9, color: { argb: "FF95A5A6" } };
      ws.getCell("A2").alignment = { horizontal: "center" };

      const header = ws.addRow(["No", "NIP", "Nama Lengkap", "Jabatan", "Username", "No. HP", "Hak Akses"]);
      applyHeaderStyle(header);

      ws.columns = [
        { key: "no", width: 6 },
        { key: "nip", width: 22 },
        { key: "nama", width: 30 },
        { key: "jabatan", width: 22 },
        { key: "username", width: 22 },
        { key: "hp", width: 16 },
        { key: "role", width: 14 },
      ];

      data.forEach((p, i) => {
        const row = ws.addRow([i + 1, p.nip, p.namaLengkap, p.jabatan, p.username, p.noHp || "-", p.accessLevel]);
        applyDataStyle(row);
        if (i % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FA" } };
          });
        }
      });

      filename = "data_pegawai";

    } else if (type === "presensi") {
      const where: any = {};
      if (user.accessLevel === "UMUM") where.pegawaiId = user.id;
      let dateLabel = "Semua";

      if (tanggal) {
        const d = new Date(tanggal);
        d.setUTCHours(0, 0, 0, 0);
        where.date = d;
        dateLabel = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      }
      if (bulan) {
        const [y, m] = bulan.split("-").map(Number);
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1);
        where.date = { gte: start, lt: end };
        dateLabel = start.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      }

      // Read from DailyAttendanceSummary — includes resolved IZIN from cuti
      const data = await db.dailyAttendanceSummary.findMany({
        where,
        include: { pegawai: { select: { namaLengkap: true, nip: true, jabatan: true } } },
        orderBy: [{ date: "desc" }, { pegawai: { namaLengkap: "asc" } }],
      });

      const ws = workbook.addWorksheet("Presensi");

      ws.mergeCells("A1:G1");
      ws.getCell("A1").value = "LAPORAN PRESENSI — SMPIT ASY-SYADZILI";
      ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF2C3E50" } };
      ws.getCell("A1").alignment = { horizontal: "center" };

      ws.mergeCells("A2:G2");
      ws.getCell("A2").value = `Periode: ${dateLabel}`;
      ws.getCell("A2").font = { size: 9, color: { argb: "FF95A5A6" } };
      ws.getCell("A2").alignment = { horizontal: "center" };

      const header = ws.addRow(["No", "Tanggal", "NIP", "Nama", "Jabatan", "Status", "Keterangan"]);
      applyHeaderStyle(header);

      ws.columns = [
        { key: "no", width: 6 },
        { key: "tanggal", width: 18 },
        { key: "nip", width: 22 },
        { key: "nama", width: 28 },
        { key: "jabatan", width: 22 },
        { key: "status", width: 12 },
        { key: "keterangan", width: 24 },
      ];

      data.forEach((s, i) => {
        const row = ws.addRow([
          i + 1,
          new Date(s.date).toLocaleDateString("id-ID"),
          s.pegawai.nip,
          s.pegawai.namaLengkap,
          s.pegawai.jabatan,
          s.status,
          s.keterangan || "-",
        ]);
        applyDataStyle(row, 6);
      });

      // Summary row
      ws.addRow([]);
      const summary = ws.addRow(["", "", "", "", "Total:", data.length, ""]);
      summary.getCell(5).font = { bold: true, size: 10 };
      summary.getCell(6).font = { bold: true, size: 10 };

      filename = `presensi_${tanggal || bulan || "all"}`;

    } else if (type === "cuti") {
      const where: any = {};
      if (user.accessLevel === "UMUM") where.pegawaiId = user.id;
      const data = await db.cuti.findMany({
        where,
        include: { pegawai: { select: { namaLengkap: true } } },
        orderBy: { createdAt: "desc" },
      });

      const ws = workbook.addWorksheet("Data Cuti");

      ws.mergeCells("A1:H1");
      ws.getCell("A1").value = "DATA CUTI PEGAWAI — SMPIT ASY-SYADZILI";
      ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF2C3E50" } };
      ws.getCell("A1").alignment = { horizontal: "center" };

      ws.mergeCells("A2:H2");
      ws.getCell("A2").value = `Diekspor: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
      ws.getCell("A2").font = { size: 9, color: { argb: "FF95A5A6" } };
      ws.getCell("A2").alignment = { horizontal: "center" };

      const header = ws.addRow(["No", "Nama", "Jenis", "Mulai", "Selesai", "Lama", "Alasan", "Status"]);
      applyHeaderStyle(header);

      ws.columns = [
        { key: "no", width: 6 },
        { key: "nama", width: 28 },
        { key: "jenis", width: 16 },
        { key: "mulai", width: 16 },
        { key: "selesai", width: 16 },
        { key: "lama", width: 8 },
        { key: "alasan", width: 30 },
        { key: "status", width: 14 },
      ];

      data.forEach((c, i) => {
        const row = ws.addRow([
          i + 1,
          c.pegawai.namaLengkap,
          c.jenisCuti,
          new Date(c.tanggalMulai).toLocaleDateString("id-ID"),
          new Date(c.tanggalSelesai).toLocaleDateString("id-ID"),
          c.lamaHari,
          c.alasan,
          c.status,
        ]);
        applyDataStyle(row, 8); // status is column 8
      });

      filename = "data_cuti";

    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Generate XLSX buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
