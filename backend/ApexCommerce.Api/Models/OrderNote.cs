using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApexCommerce.Api.Models
{
    [Table("OrderNotes", Schema = "dbo")]
    public class OrderNote
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int NoteId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        [MaxLength(50)]
        public string OrderNumber { get; set; } = string.Empty;

        [Required]
        public string ContentHtml { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string CreatedByAdmin { get; set; } = string.Empty;

        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        public DateTime? LastUpdatedUtc { get; set; }

        [Required]
        public bool IsSystemLog { get; set; } = false;
    }
}