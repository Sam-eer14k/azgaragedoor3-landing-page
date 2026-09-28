<?php
/**
 * AZ Garage Door theme functions.
 *
 * @package AZ_Garage_Door
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AZGD_VERSION', '1.0.0' );

/**
 * Theme supports and menu registration.
 */
function azgd_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'automatic-feed-links' );

	add_theme_support(
		'html5',
		array( 'search-form', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);

	add_theme_support(
		'custom-logo',
		array(
			'height'      => 58,
			'width'       => 240,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);

	register_nav_menus(
		array(
			'primary' => __( 'Primary menu', 'az-garage-door' ),
			'footer'  => __( 'Footer repairs menu', 'az-garage-door' ),
		)
	);
}
add_action( 'after_setup_theme', 'azgd_setup' );

/**
 * Styles and scripts.
 */
function azgd_assets() {
	$uri = get_template_directory_uri();
	$dir = get_template_directory();

	wp_enqueue_style(
		'azgd-fonts',
		'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;600;700&display=swap',
		array(),
		null
	);

	$css = $dir . '/assets/css/theme.css';
	wp_enqueue_style(
		'azgd-theme',
		$uri . '/assets/css/theme.css',
		array( 'azgd-fonts' ),
		file_exists( $css ) ? filemtime( $css ) : AZGD_VERSION
	);

	// style.css carries the theme header and the non front page fallbacks.
	wp_enqueue_style(
		'azgd-shell',
		get_stylesheet_uri(),
		array( 'azgd-theme' ),
		AZGD_VERSION
	);

	$js = $dir . '/assets/js/main.js';
	wp_enqueue_script(
		'azgd-main',
		$uri . '/assets/js/main.js',
		array(),
		file_exists( $js ) ? filemtime( $js ) : AZGD_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'azgd_assets' );

/**
 * Preconnect to the Google Fonts hosts.
 *
 * @param array  $urls           URLs already queued for the relation.
 * @param string $relation_type  The relation type being filtered.
 * @return array
 */
function azgd_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = array( 'href' => 'https://fonts.googleapis.com' );
		$urls[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'azgd_resource_hints', 10, 2 );

/**
 * Favicons and theme colour, so the site works without the Customizer icon.
 */
function azgd_head_icons() {
	if ( has_site_icon() ) {
		return;
	}
	$uri = get_template_directory_uri() . '/assets/images';
	?>
	<link rel="icon" href="<?php echo esc_url( $uri . '/favicon.ico' ); ?>" sizes="any">
	<link rel="icon" type="image/png" sizes="32x32" href="<?php echo esc_url( $uri . '/favicon-32.png' ); ?>">
	<link rel="icon" type="image/png" sizes="16x16" href="<?php echo esc_url( $uri . '/favicon-16.png' ); ?>">
	<link rel="apple-touch-icon" sizes="180x180" href="<?php echo esc_url( $uri . '/favicon-180.png' ); ?>">
	<meta name="theme-color" content="#1a3e9c">
	<meta name="format-detection" content="telephone=yes">
	<?php
}
add_action( 'wp_head', 'azgd_head_icons', 2 );

/**
 * LocalBusiness structured data on the front page.
 */
function azgd_schema() {
	if ( ! is_front_page() ) {
		return;
	}

	$schema = array(
		'@context'                    => 'https://schema.org',
		'@type'                       => 'LocalBusiness',
		'name'                        => 'AZ Garage Door',
		'url'                         => home_url( '/' ),
		'telephone'                   => azgd_phone( 'link' ),
		'email'                       => azgd_email(),
		'foundingDate'                => '2011',
		'priceRange'                  => '$$',
		'areaServed'                  => array( 'Phoenix', 'Scottsdale', 'Tempe', 'Mesa', 'Chandler' ),
		'openingHoursSpecification'   => array(
			'@type'     => 'OpeningHoursSpecification',
			'dayOfWeek' => array( 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ),
			'opens'     => '00:00',
			'closes'    => '23:59',
		),
	);

	echo '<script type="application/ld+json">'
		. wp_json_encode( $schema, JSON_UNESCAPED_SLASHES )
		. '</script>' . "\n";
}
add_action( 'wp_head', 'azgd_schema', 20 );

/**
 * The business phone number, editable from the Customizer.
 *
 * @param string $format 'display' for 480-821-1111, 'link' for the tel: value.
 * @return string
 */
function azgd_phone( $format = 'display' ) {
	$number = get_theme_mod( 'azgd_phone', '480-821-1111' );

	if ( 'link' === $format ) {
		$digits = preg_replace( '/\D+/', '', $number );
		if ( 10 === strlen( $digits ) ) {
			$digits = '1' . $digits;
		}
		return '+' . $digits;
	}

	return $number;
}

/**
 * The business email, editable from the Customizer.
 *
 * @return string
 */
function azgd_email() {
	return get_theme_mod( 'azgd_email', 'service@azgaragedoor.com' );
}

/**
 * Customizer fields for the details that change most often.
 *
 * @param WP_Customize_Manager $wp_customize Customizer instance.
 */
function azgd_customize( $wp_customize ) {
	$wp_customize->add_section(
		'azgd_contact',
		array(
			'title'       => __( 'AZ Garage Door contact', 'az-garage-door' ),
			'priority'    => 30,
			'description' => __( 'The number and address used across the page, the footer and the sticky mobile call bar.', 'az-garage-door' ),
		)
	);

	$wp_customize->add_setting(
		'azgd_phone',
		array(
			'default'           => '480-821-1111',
			'sanitize_callback' => 'sanitize_text_field',
			'transport'         => 'refresh',
		)
	);
	$wp_customize->add_control(
		'azgd_phone',
		array(
			'label'   => __( 'Phone number', 'az-garage-door' ),
			'section' => 'azgd_contact',
			'type'    => 'text',
		)
	);

	$wp_customize->add_setting(
		'azgd_email',
		array(
			'default'           => 'service@azgaragedoor.com',
			'sanitize_callback' => 'sanitize_email',
			'transport'         => 'refresh',
		)
	);
	$wp_customize->add_control(
		'azgd_email',
		array(
			'label'   => __( 'Email address', 'az-garage-door' ),
			'section' => 'azgd_contact',
			'type'    => 'email',
		)
	);
}
add_action( 'customize_register', 'azgd_customize' );

/**
 * Trim the WordPress admin bar offset, which otherwise pushes the sticky header.
 */
function azgd_admin_bar_css() {
	if ( ! is_admin_bar_showing() ) {
		return;
	}
	echo '<style>.hdr{top:32px}@media screen and (max-width:782px){.hdr{top:46px}}</style>' . "\n";
}
add_action( 'wp_head', 'azgd_admin_bar_css', 30 );
