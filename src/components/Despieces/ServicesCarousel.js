import React, { useEffect, useRef, useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './ServicesCarousel.css';

const ServicesCarousel = ({ services = [], onSelect, slidesToShow = 3, speed = 300, unavailable = false }) => {
  const sliderRef = useRef(null);
  const carouselRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [visibleCount, setVisibleCount] = useState(slidesToShow);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)');
    const update = ({ matches }) => setVisibleCount(matches ? 1 : slidesToShow);
    update(media);
    media.addListener?.(update);
    return () => media.removeListener?.(update);
  }, [slidesToShow]);
  if (unavailable) return <div role="status">Carousel unavailable<ul>{services.map((service) => <li key={service.serviceId}><button type="button" aria-label={`Select ${service.nomenclatura}`} onClick={() => onSelect?.(service)}>{service.nomenclatura}</button></li>)}</ul></div>;
  if (!services.length) return <div role="status">No services available</div>;
  const settings = {
    dots: false,
    arrows: false,
    infinite: false,
    speed,
    slidesToShow,
    slidesToScroll: 1,
    beforeChange: (_, index) => setActiveSlide(index),
    afterChange: (index) => { carouselRef.current?.querySelector(`[data-carousel-index="${index}"]`)?.focus(); }
  };
  return (
    <section ref={carouselRef} aria-label="Services carousel" className="services-carousel" data-overflow-contract="contained">
      <Slider ref={sliderRef} {...settings} responsive={[{ breakpoint: 600, settings: { slidesToShow: 1 } }]}>
        {services.map((service, index) => (
          <div key={service.serviceId || service.nomenclatura}>
            <button
              type="button"
              aria-label={`Select ${service.nomenclatura}`}
              onClick={() => onSelect?.(service)}
              onKeyDown={(event) => { if (event.key === 'ArrowRight') sliderRef.current?.slickNext(); if (event.key === 'ArrowLeft') sliderRef.current?.slickPrev(); }}
              data-carousel-index={index}
              tabIndex={index >= activeSlide && index < activeSlide + visibleCount ? 0 : -1}
            >
              {service.nomenclatura}
            </button>
          </div>
        ))}
      </Slider>
      <button type="button" aria-label="Previous" onClick={() => sliderRef.current?.slickPrev()}>Previous</button>
      <button type="button" aria-label="Next" onClick={() => sliderRef.current?.slickNext()}>Next</button>
    </section>
  );
};

export default ServicesCarousel;
