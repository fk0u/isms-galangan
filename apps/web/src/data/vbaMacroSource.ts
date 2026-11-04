/**
 * Source code Visual Basic for Applications (VBA) untuk aplikasi Excel Laporan Keuangan ISMS.
 * Dapat diimpor ke Excel via VBA Editor (Alt + F11 -> File -> Import File...)
 * atau disalin langsung dari sheet "Aplikasi Macro VB (VBA)".
 */

export const VBA_MACRO_SOURCE = `' ==============================================================================
' PT. SYUKUR BERSAUDARA - INTEGRATED SHIPYARD MANAGEMENT SYSTEM (ISMS)
' MODUL MACRO VBA APLIKASI KEUANGAN & EXECUTIVE DASHBOARD
' Versi: 2.4 Enterprise | Kompatibel: Microsoft Excel 2013, 2016, 2019, 2021, Office 365
' ==============================================================================
Option Explicit

' ------------------------------------------------------------------------------
' 1. NAVIGASI ANTAR SHEET APLIKASI
' ------------------------------------------------------------------------------
Public Sub GoTo_Dashboard()
    On Error Resume Next
    Sheets("Dashboard & Grafik").Activate
    ActiveWindow.ScrollRow = 1
    ActiveWindow.ScrollColumn = 1
    Range("A1").Select
End Sub

Public Sub GoTo_Neraca()
    On Error Resume Next
    Sheets("Neraca").Activate
    ActiveWindow.ScrollRow = 1
    ActiveWindow.ScrollColumn = 1
    Range("A1").Select
End Sub

Public Sub GoTo_LabaRugi()
    On Error Resume Next
    Sheets("Laba Rugi").Activate
    ActiveWindow.ScrollRow = 1
    ActiveWindow.ScrollColumn = 1
    Range("A1").Select
End Sub

Public Sub GoTo_NeracaLajur()
    On Error Resume Next
    Sheets("Neraca Lajur").Activate
    ActiveWindow.ScrollRow = 1
    ActiveWindow.ScrollColumn = 1
    Range("A1").Select
End Sub

Public Sub GoTo_KasBank()
    On Error Resume Next
    Sheets("JU, Kas, Bank").Activate
    ActiveWindow.ScrollRow = 1
    ActiveWindow.ScrollColumn = 1
    Range("A1").Select
End Sub

Public Sub GoTo_Hutang()
    On Error Resume Next
    Sheets("Hutang").Activate
    ActiveWindow.ScrollRow = 1
    ActiveWindow.ScrollColumn = 1
    Range("A1").Select
End Sub

Public Sub GoTo_Piutang()
    On Error Resume Next
    Sheets("Piutang").Activate
    ActiveWindow.ScrollRow = 1
    ActiveWindow.ScrollColumn = 1
    Range("A1").Select
End Sub

Public Sub GoTo_BukuBesar()
    On Error Resume Next
    Sheets("Buku Besar").Activate
    ActiveWindow.ScrollRow = 1
    ActiveWindow.ScrollColumn = 1
    Range("A1").Select
End Sub

Public Sub GoTo_COA()
    On Error Resume Next
    Sheets("Akun").Activate
    ActiveWindow.ScrollRow = 1
    ActiveWindow.ScrollColumn = 1
    Range("A1").Select
End Sub

' ------------------------------------------------------------------------------
' 2. AUDIT & VALIDASI KESEIMBANGAN NERACA
' ------------------------------------------------------------------------------
Public Sub CekKeseimbanganNeraca()
    Dim ws As Worksheet
    Dim totalAktiva As Double
    Dim totalPasiva As Double
    Dim selisih As Double
    Dim r As Long, lastRow As Long
    
    On Error Resume Next
    Set ws = Sheets("Neraca")
    If ws Is Nothing Then
        MsgBox "Sheet 'Neraca' tidak ditemukan dalam berkas ini.", vbCritical, "ISMS Error"
        Exit Sub
    End If
    
    lastRow = ws.Cells(ws.Rows.Count, "E").End(xlUp).Row
    
    ' Mencari nilai Total Aktiva di Kolom E
    For r = 1 To lastRow
        If InStr(1, UCase(ws.Cells(r, 2).Value), "TOTAL AKTIVA") > 0 Or InStr(1, UCase(ws.Cells(r, 5).Value), "TOTAL AKTIVA") > 0 Then
            totalAktiva = Val(ws.Cells(r, 5).Value)
            Exit For
        End If
    Next r
    
    ' Mencari nilai Total Pasiva di Kolom K
    For r = 1 To lastRow
        If InStr(1, UCase(ws.Cells(r, 8).Value), "TOTAL PASIVA") > 0 Or InStr(1, UCase(ws.Cells(r, 11).Value), "TOTAL PASIVA") > 0 Then
            totalPasiva = Val(ws.Cells(r, 11).Value)
            Exit For
        End If
    Next r
    
    selisih = Abs(totalAktiva - totalPasiva)
    
    If selisih < 1 Then
        MsgBox "=== AUDIT KESEIMBANGAN NERACA: VALID ===" & vbCrLf & vbCrLf & _
               "Total Aktiva : Rp " & Format(totalAktiva, "#,##0") & vbCrLf & _
               "Total Pasiva : Rp " & Format(totalPasiva, "#,##0") & vbCrLf & _
               "Selisih      : Rp 0 (SEIMBANG / BALANCE)" & vbCrLf & vbCrLf & _
               "Status: Laporan Neraca telah terverifikasi akurat dan siap diterbitkan.", _
               vbInformation, "ISMS Accounting Integrity Check"
    Else
        MsgBox "=== PERINGATAN: NERACA TIDAK SEIMBANG ===" & vbCrLf & vbCrLf & _
               "Total Aktiva : Rp " & Format(totalAktiva, "#,##0") & vbCrLf & _
               "Total Pasiva : Rp " & Format(totalPasiva, "#,##0") & vbCrLf & _
               "Selisih      : Rp " & Format(selisih, "#,##0") & vbCrLf & vbCrLf & _
               "Silakan periksa pos Historical Balancing (3-999) atau jurnal penyesuaian.", _
               vbExclamation, "ISMS Audit Alert"
    End If
End Sub

' ------------------------------------------------------------------------------
' 3. FILTER CEPAT JURNAL / TRANSAKSI KAS & BANK
' ------------------------------------------------------------------------------
Public Sub FilterCepatTransaksi()
    Dim ws As Worksheet
    Dim kataKunci As String
    
    On Error Resume Next
    Set ws = Sheets("JU, Kas, Bank")
    If ws Is Nothing Then Exit Sub
    
    ws.Activate
    kataKunci = InputBox("Masukkan kata kunci pencarian transaksi (misal: BBM, BCA, Plat, Konsumsi):", _
                         "Filter Cepat Jurnal & Kas Bank")
    
    If Trim(kataKunci) = "" Then
        If ws.FilterMode Then ws.ShowAllData
        MsgBox "Semua data transaksi kembali ditampilkan.", vbInformation, "Filter Direset"
        Exit Sub
    End If
    
    ' Aktifkan autofilter pada baris tabel transaksi
    If Not ws.AutoFilterMode Then
        ws.Range("A3:I" & ws.Cells(ws.Rows.Count, "A").End(xlUp).Row).AutoFilter
    End If
    
    ws.Range("A3:I" & ws.Cells(ws.Rows.Count, "A").End(xlUp).Row).AutoFilter _
        Field:=4, Criteria1:="*" & kataKunci & "*", Operator:=xlFilterValues
End Sub

' ------------------------------------------------------------------------------
' 4. PENCARIAN AKUN PADA BUKU BESAR
' ------------------------------------------------------------------------------
Public Sub CariAkunBukuBesar()
    Dim ws As Worksheet
    Dim kodeCari As String
    Dim c As Range
    
    On Error Resume Next
    Set ws = Sheets("Buku Besar")
    If ws Is Nothing Then Exit Sub
    
    ws.Activate
    kodeCari = InputBox("Masukkan Kode Akun COA yang dicari (contoh: 1-110 atau 4-100):", _
                        "Cari Akun Buku Besar")
    
    If Trim(kodeCari) = "" Then Exit Sub
    
    Set c = ws.Columns("A").Find(What:=kodeCari, LookIn:=xlValues, LookAt:=xlPart)
    If Not c Is Nothing Then
        c.Select
        MsgBox "Akun ditemukan pada baris " & c.Row & ": " & c.Offset(0, 1).Value, vbInformation, "Akun Ditemukan"
    Else
        MsgBox "Kode akun '" & kodeCari & "' tidak ditemukan dalam Buku Besar.", vbExclamation, "Tidak Ditemukan"
    End If
End Sub

' ------------------------------------------------------------------------------
' 5. MODE TAMPILAN PRESENTASI (APP COCKPIT MODE)
' ------------------------------------------------------------------------------
Public Sub ModeAplikasiDashboard()
    On Error Resume Next
    Application.ScreenUpdating = False
    
    ' Sembunyikan garis kisi dan judul kolom/baris untuk pengalaman seperti software
    ActiveWindow.DisplayGridlines = False
    ActiveWindow.DisplayHeadings = True
    
    Call GoTo_Dashboard
    Application.ScreenUpdating = True
    
    MsgBox "Mode Aplikasi Dashboard Aktif. Gunakan tombol menu navigasi di atas untuk berpindah lembar.", _
           vbInformation, "ISMS Dashboard Mode"
End Sub

Public Sub ModeStandarExcel()
    On Error Resume Next
    ActiveWindow.DisplayGridlines = True
    ActiveWindow.DisplayHeadings = True
    MsgBox "Tampilan grid standar Excel telah dipulihkan.", vbInformation, "Excel Standard Mode"
End Sub

' ------------------------------------------------------------------------------
' 6. SATU KLIK EKSPOR KE PDF (SIAP CETAK RESMI)
' ------------------------------------------------------------------------------
Public Sub EksporLembarKePDF()
    Dim ws As Worksheet
    Dim pdfPath As String
    Dim defName As String
    
    Set ws = ActiveSheet
    defName = "Laporan_" & Replace(ws.Name, " ", "_") & "_" & Format(Date, "yyyymmdd") & ".pdf"
    pdfPath = Application.DefaultFilePath & Application.PathSeparator & defName
    
    On Error GoTo GagalPDF
    ws.ExportAsFixedFormat Type:=xlTypePDF, Filename:=pdfPath, Quality:=xlQualityStandard, _
        IncludeDocProperties:=True, IgnorePrintAreas:=False, OpenAfterPublish:=True
        
    MsgBox "Laporan berhasil diekspor ke PDF:" & vbCrLf & pdfPath, vbInformation, "Ekspor PDF Berhasil"
    Exit Sub

GagalPDF:
    MsgBox "Gagal mengekspor PDF: " & Err.Description, vbCritical, "Error Ekspor"
End Sub
`;

/**
 * Memicu pengunduhan berkas .bas (Visual Basic Module) langsung dari browser
 * sehingga pengguna dapat mengimpornya ke Excel via Alt+F11 -> File -> Import File.
 */
export function downloadVbaModule(filename = "ISMS_Financial_Macros.bas"): void {
  const blob = new Blob([VBA_MACRO_SOURCE], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

