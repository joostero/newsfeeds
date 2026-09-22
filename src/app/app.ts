import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

interface NewsItem {
  title: string;
  link: string;
  description: string;
  date: string;
  source: string;
  imageUrl: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  protected readonly title = signal('Isero Nieuws');
  protected readonly items = signal<NewsItem[]>([]);

  // 1-based index from the `newsItem` query parameter (defaults to 1).
  private readonly newsItemIndex = toSignal(
    this.route.queryParamMap.pipe(map((params) => Number(params.get('newsItem')) || 1)),
    { initialValue: 1 }
  );

  protected readonly selectedItems = computed<NewsItem[]>(() => {
    const items = this.items();
    const start = this.newsItemIndex() - 1;
    return items.slice(start, start + 2);
  });

  constructor() {
    this.http.get('data/news.xml', { responseType: 'text' }).subscribe((xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const items = Array.from(doc.querySelectorAll('item'))
        .filter((item) => !(item.querySelector('title')?.textContent ?? '').includes('|'))
        .map((item) => {
          const link = item.querySelector('link')?.textContent ?? '';
          const pubDate = item.querySelector('pubDate')?.textContent ?? '';

          return {
            title: item.querySelector('title')?.textContent ?? '',
            link,
            description: item.querySelector('description')?.textContent ?? '',
            date: this.formatDate(pubDate),
            source: this.hostname(link),
            imageUrl: item.querySelector('enclosure')?.getAttribute('url') ?? ''
          };
        });

      this.items.set(items);
    });
  }

  private formatDate(pubDate: string): string {
    const date = new Date(pubDate);
    if (isNaN(date.getTime())) {
      return pubDate;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${date.getFullYear()}`;
  }

  private hostname(link: string): string {
    try {
      return new URL(link).hostname;
    } catch {
      return '';
    }
  }
}
