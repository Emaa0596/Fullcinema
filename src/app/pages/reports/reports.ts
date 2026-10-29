import { Component, inject, signal } from '@angular/core';
import { ReportService } from '../../services/report.service';
import { jsPDF } from 'jspdf';
import { utils, writeFile } from 'xlsx';

@Component({
    selector: 'app-reports',
    imports: [],
    templateUrl: './reports.html',
    styleUrl: './reports.css'
})
export class Reports {
    private readonly reportService = inject(ReportService);

    readonly dailyRevenue = signal<any[]>([]);
    readonly dailyTickets = signal<any[]>([]);
    readonly weeklyMovies = signal<any[]>([]);
    readonly monthlyMovies = signal<any[]>([]);
    readonly topCandy = signal<any[]>([]);
    readonly loading = signal(true);
    readonly error = signal('');

    constructor() { this.loadReports(); }

    async loadReports() {
        this.loading.set(true);
        this.error.set('');

        const [revenue,tickets,weekly,monthly,candy] = await Promise.all([
            this.reportService.getDailyRevenue(),
            this.reportService.getDailyTickets(),
            this.reportService.getTopMovies(7),
            this.reportService.getTopMovies(30),
            this.reportService.getTopCandy()
        ]);

        if(revenue.error || tickets.error || weekly.error || monthly.error || candy.error){
            this.error.set(revenue.error?.message || tickets.error?.message || weekly.error?.message || monthly.error?.message || candy.error?.message || 'Error al cargar reportes.');
            this.loading.set(false);
            return;
        }

        this.dailyRevenue.set(revenue.data ?? []);
        this.dailyTickets.set(tickets.data ?? []);
        this.weeklyMovies.set(weekly.data ?? []);
        this.monthlyMovies.set(monthly.data ?? []);
        this.topCandy.set(candy.data ?? []);
        this.loading.set(false);
    }

    exportPdf() {
      const pdf=new jsPDF();
      let y=18;

      pdf.setFontSize(18);
      pdf.text('Reporte FullCinema',14,y);
      y+=12;

      pdf.setFontSize(13);
      pdf.text('Facturación diaria',14,y);
      y+=7;

      this.dailyRevenue().forEach(item=>{
          pdf.setFontSize(10);
          pdf.text(`${item.fecha} - $${item.total}`,18,y);
          y+=6;
          if(y>280){ pdf.addPage(); y=18; }
      });

      y+=5;
      pdf.setFontSize(13);
      pdf.text('Entradas vendidas por día',14,y);
      y+=7;

      this.dailyTickets().forEach(item=>{
          pdf.setFontSize(10);
          pdf.text(`${item.fecha} - ${item.cantidad} entradas`,18,y);
          y+=6;
          if(y>280){ pdf.addPage(); y=18; }
      });

      y+=5;
      pdf.setFontSize(13);
      pdf.text('Películas más vistas - 7 días',14,y);
      y+=7;

      this.weeklyMovies().forEach(movie=>{
          pdf.setFontSize(10);
          pdf.text(`${movie.nombre} - ${movie.entradas} entradas`,18,y);
          y+=6;
          if(y>280){ pdf.addPage(); y=18; }
      });

      y+=5;
      pdf.setFontSize(13);
      pdf.text('Películas más vistas - 30 días',14,y);
      y+=7;

      this.monthlyMovies().forEach(movie=>{
          pdf.setFontSize(10);
          pdf.text(`${movie.nombre} - ${movie.entradas} entradas`,18,y);
          y+=6;
          if(y>280){ pdf.addPage(); y=18; }
      });

      y+=5;
      pdf.setFontSize(13);
      pdf.text('Candy más vendido',14,y);
      y+=7;

      this.topCandy().forEach(item=>{
          pdf.setFontSize(10);
          pdf.text(`${item.nombre} - ${item.cantidad} unidades`,18,y);
          y+=6;
          if(y>280){ pdf.addPage(); y=18; }
      });

      pdf.save('reporte-fullcinema.pdf');
  }

  exportExcel() {
    const workbook=utils.book_new();
    const revenueSheet=utils.json_to_sheet(this.dailyRevenue().map(item=>({Fecha:item.fecha,Facturacion:Number(item.total)})));
    const ticketsSheet=utils.json_to_sheet(this.dailyTickets().map(item=>({Fecha:item.fecha,Entradas:Number(item.cantidad)})));
    const weeklySheet=utils.json_to_sheet(this.weeklyMovies().map(movie=>({Pelicula:movie.nombre,Entradas:Number(movie.entradas)})));
    const monthlySheet=utils.json_to_sheet(this.monthlyMovies().map(movie=>({Pelicula:movie.nombre,Entradas:Number(movie.entradas)})));
    const candySheet=utils.json_to_sheet(this.topCandy().map(item=>({Producto:item.nombre,Cantidad:Number(item.cantidad)})));
    utils.book_append_sheet(workbook,revenueSheet,'Facturacion');
    utils.book_append_sheet(workbook,ticketsSheet,'Entradas');
    utils.book_append_sheet(workbook,weeklySheet,'Top semanal');
    utils.book_append_sheet(workbook,monthlySheet,'Top mensual');
    utils.book_append_sheet(workbook,candySheet,'Candy');
    writeFile(workbook,'reporte-fullcinema.xlsx');
  }
}