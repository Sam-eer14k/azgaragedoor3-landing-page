<?php
/**
 * Fallback template for anything that is not the front page.
 *
 * @package AZ_Garage_Door
 */

get_header();
?>

<main id="main" class="page-shell">
	<?php
	if ( have_posts() ) :
		while ( have_posts() ) :
			the_post();
			?>
			<article <?php post_class(); ?>>
				<h1><?php the_title(); ?></h1>
				<?php the_content(); ?>
			</article>
			<?php
		endwhile;

		the_posts_pagination();
	else :
		?>
		<h1><?php esc_html_e( 'Nothing here', 'az-garage-door' ); ?></h1>
		<p>
			<?php esc_html_e( 'That page has moved or never existed.', 'az-garage-door' ); ?>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Go back to the front page', 'az-garage-door' ); ?></a>,
			<?php esc_html_e( 'or call us on', 'az-garage-door' ); ?>
			<a href="tel:<?php echo esc_attr( azgd_phone( 'link' ) ); ?>"><?php echo esc_html( azgd_phone() ); ?></a>.
		</p>
		<?php
	endif;
	?>
</main>

<?php
get_footer();
