namespace Application.Interfaces
{
    public interface IVercelBlobService
    {
        Task<string> UploadFileAsync(byte[] file, string fileName, string folderName);
    }
}
