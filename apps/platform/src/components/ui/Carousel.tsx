'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box, { type BoxProps } from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ResponsiveStyleValue } from '@mui/system';

export type CarouselProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T, index: number) => string | number;
  /** Width of each slide — used for layout and page calculation. */
  itemWidth?: ResponsiveStyleValue<string | number>;
  /** Extra styles applied to each slide wrapper. */
  itemSx?: SxProps<Theme>;
  /** Gap between slides (theme spacing units). */
  gap?: number;
  /** Styles applied to the scroll track. */
  trackSx?: SxProps<Theme>;
  /** Styles applied to the controls row. */
  controlsSx?: SxProps<Theme>;
  /** Negative horizontal margin on small screens so slides can bleed to the edge. */
  trackBleed?: boolean;
  /** Hide prev/next arrows and pagination dots. */
  hideControls?: boolean;
  ariaLabelPrevious?: string;
  ariaLabelNext?: string;
  getPageAriaLabel?: (pageIndex: number) => string;
} & Omit<BoxProps, 'children'>;

export function Carousel<T>({
  items,
  renderItem,
  getItemKey,
  itemWidth,
  itemSx,
  gap = 3,
  trackSx,
  controlsSx,
  trackBleed = false,
  hideControls = false,
  ariaLabelPrevious = 'Previous',
  ariaLabelNext = 'Next',
  getPageAriaLabel = (pageIndex) => `Page ${pageIndex + 1}`,
  sx,
  ...rootProps
}: CarouselProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(items.length > 1);
  const [itemsPerPage, setItemsPerPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const activePage = Math.floor(activeIndex / itemsPerPage);

  useEffect(() => {
    itemRefs.current.length = items.length;
  }, [items.length]);

  useEffect(() => {
    const track = trackRef.current;
    const firstItem = itemRefs.current[0];
    if (!track || !firstItem) return;

    const measure = () => {
      const count = Math.round(track.clientWidth / firstItem.offsetWidth);
      setItemsPerPage(Math.max(1, count));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [items.length]);

  const scrollToItem = useCallback((index: number) => {
    itemRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'start',
      block: 'nearest',
    });
  }, []);

  const goPrev = useCallback(() => {
    scrollToItem(Math.max(0, activePage - 1) * itemsPerPage);
  }, [activePage, itemsPerPage, scrollToItem]);

  const goNext = useCallback(() => {
    scrollToItem(Math.min(totalPages - 1, activePage + 1) * itemsPerPage);
  }, [activePage, itemsPerPage, scrollToItem, totalPages]);

  const syncState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    const absScroll = Math.abs(scrollLeft);
    const maxScroll = scrollWidth - clientWidth;
    setCanPrev(absScroll > 2);
    setCanNext(maxScroll - absScroll > 2);

    const isRtl = getComputedStyle(track).direction === 'rtl';
    const trackRect = track.getBoundingClientRect();
    const snapEdge = isRtl ? trackRect.right : trackRect.left;

    let closest = 0;
    let minDist = Infinity;
    itemRefs.current.forEach((item, i) => {
      if (!item) return;
      const rect = item.getBoundingClientRect();
      const itemEdge = isRtl ? rect.right : rect.left;
      const dist = Math.abs(itemEdge - snapEdge);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let debounceTimer: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = track;
      const absScroll = Math.abs(scrollLeft);
      const maxScroll = scrollWidth - clientWidth;
      setCanPrev(absScroll > 2);
      setCanNext(maxScroll - absScroll > 2);

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(syncState, 80);
    };

    const onScrollEnd = () => {
      clearTimeout(debounceTimer);
      syncState();
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    track.addEventListener('scrollend', onScrollEnd, { passive: true });
    syncState();

    return () => {
      track.removeEventListener('scroll', onScroll);
      track.removeEventListener('scrollend', onScrollEnd);
      clearTimeout(debounceTimer);
    };
  }, [syncState, items.length]);

  const showControls = !hideControls && items.length > itemsPerPage;

  return (
    <Box sx={sx} {...rootProps}>
      <Box
        ref={trackRef}
        sx={[
          {
            display: 'flex',
            gap,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            pb: 1,
            ...(trackBleed
              ? { mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 } }
              : {}),
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          },
          ...(Array.isArray(trackSx) ? trackSx : trackSx ? [trackSx] : []),
        ]}
      >
        {items.map((item, index) => (
          <Box
            key={getItemKey(item, index)}
            ref={(el: HTMLElement | null) => {
              itemRefs.current[index] = el;
            }}
            sx={[
              {
                flexShrink: 0,
                scrollSnapAlign: 'start',
                ...(itemWidth ? { width: itemWidth } : {}),
              },
              ...(Array.isArray(itemSx) ? itemSx : itemSx ? [itemSx] : []),
            ]}
          >
            {renderItem(item, index)}
          </Box>
        ))}
      </Box>

      {showControls ? (
        <Stack
          direction="row"
          sx={[
            {
              justifyContent: 'center',
              alignItems: 'center',
              mt: 3,
              gap: 2,
            },
            ...(Array.isArray(controlsSx)
              ? controlsSx
              : controlsSx
                ? [controlsSx]
                : []),
          ]}
        >
          <IconButton
            onClick={goPrev}
            disabled={!canPrev}
            size="small"
            aria-label={ariaLabelPrevious}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              '&:not(:disabled)': {
                borderColor: 'primary.main',
                color: 'primary.main',
              },
            }}
          >
            <ChevronRightIcon />
          </IconButton>

          <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center' }}>
            {Array.from({ length: totalPages }, (_, page) => (
              <Box
                key={page}
                component="button"
                type="button"
                onClick={() => scrollToItem(page * itemsPerPage)}
                aria-label={getPageAriaLabel(page)}
                aria-current={page === activePage ? 'true' : undefined}
                sx={{
                  width: page === activePage ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: page === activePage ? 'primary.main' : 'divider',
                  cursor: 'pointer',
                  border: 'none',
                  p: 0,
                  transition: 'width 0.3s ease, background-color 0.3s ease',
                  '&:hover': {
                    bgcolor:
                      page === activePage ? 'primary.dark' : 'text.disabled',
                  },
                }}
              />
            ))}
          </Stack>

          <IconButton
            onClick={goNext}
            disabled={!canNext}
            size="small"
            aria-label={ariaLabelNext}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              '&:not(:disabled)': {
                borderColor: 'primary.main',
                color: 'primary.main',
              },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Stack>
      ) : null}
    </Box>
  );
}
